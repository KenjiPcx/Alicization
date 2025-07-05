import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const createTask = internalMutation({
    args: v.object({
        threadId: v.string(),
        title: v.string(),
        description: v.string(),
        plan: v.string(),
        todos: v.array(v.string()),
    }),
    handler: async (ctx, args) => {
        const { threadId, title, description, plan, todos } = args;

        const taskId = await ctx.db.insert("tasks", {
            threadId,
            title,
            description,
            plan: [plan],
            todos: todos.map((todo) => ({
                title: todo,
                status: "pending" as const,
            })),
            done: false,
        });

        return await ctx.db.get(taskId) as Doc<"tasks">;
    },
});

/**
 * Update existing plan with new plan and todos (supports replanning)
 */
export const updateTask = internalMutation({
    args: v.object({
        taskId: v.id("tasks"),
        newPlan: v.string(),
        newTodos: v.array(v.string()),
    }),
    handler: async (ctx, args) => {
        const { taskId, newPlan, newTodos } = args;

        const existingTask = await ctx.db.get(taskId);
        if (!existingTask) {
            throw new Error("Plan not found");
        }

        // Append new plan to the plan array (for milestoning)
        const updatedPlanArray = [...existingTask.plan, newPlan];

        // Add new todos to existing todos
        const newTodoObjects = newTodos.map((todo) => ({
            title: todo,
            status: "pending" as const,
        }));

        const updatedTodos = [...existingTask.todos, ...newTodoObjects];

        await ctx.db.patch(taskId, {
            plan: updatedPlanArray,
            todos: updatedTodos,
        });

        return await ctx.db.get(taskId) as Doc<"tasks">;
    },
});

/**
 * Complete the current task
 */
export const completeTask = internalMutation({
    args: v.object({
        taskId: v.id("tasks"),
    }),
    handler: async (ctx, args) => {
        const { taskId } = args;

        const task = await ctx.db.get(taskId);
        if (!task) {
            throw new Error("Task not found");
        }

        await ctx.db.patch(taskId, { done: true });

        return `Task completed!`;
    },
});

/**
 * Get the most recent task for the threadId
 */
export const getLatestTask = internalQuery({
    args: v.object({
        threadId: v.string(),
    }),
    handler: async (ctx, args) => {
        const { threadId } = args;

        const task = await ctx.db
            .query("tasks")
            .filter((q) => q.and(
                q.eq(q.field("threadId"), threadId),
                q.eq(q.field("done"), false)
            ))
            .order("desc")
            .first();

        return task;
    },
});

/**
 * Start working on the first pending todo
 */
export const startNextTodo = internalMutation({
    args: v.object({
        taskId: v.id("tasks"),
    }),
    handler: async (ctx, args) => {
        const { taskId } = args;

        const task = await ctx.db.get(taskId);
        if (!task) {
            throw new Error("Plan not found");
        }

        const todos = [...task.todos];
        const pendingIndex = todos.findIndex(todo => todo.status === "pending");

        if (pendingIndex === -1) {
            return "No pending todos to start";
        }

        todos[pendingIndex] = {
            ...todos[pendingIndex],
            status: "in-progress" as const,
        };

        await ctx.db.patch(taskId, { todos });

        return `Started todo: "${todos[pendingIndex].title}"`;
    },
});

/**
 * Complete the current todo and move to the next one
 */
export const completeCurrentTodoAndMoveToNextTodo = internalMutation({
    args: v.object({
        taskId: v.id("tasks"),
    }),
    handler: async (ctx, args) => {
        const { taskId } = args;

        const task = await ctx.db.get(taskId);
        if (!task) {
            throw new Error("Task not found");
        }

        const todos = [...task.todos];
        let updated = false;

        // Complete any in-progress todos
        const inProgressIndex = todos.findIndex(todo => todo.status === "in-progress");
        if (inProgressIndex !== -1) {
            todos[inProgressIndex] = {
                ...todos[inProgressIndex],
                status: "completed" as const,
            };
            updated = true;
        }

        // Start the next pending todo
        const pendingIndex = todos.findIndex(todo => todo.status === "pending");
        if (pendingIndex !== -1) {
            todos[pendingIndex] = {
                ...todos[pendingIndex],
                status: "in-progress" as const,
            };
            updated = true;
        }

        if (updated) {
            await ctx.db.patch(taskId, { todos });
        }

        // Calculate stats for response
        const pending = todos.filter(todo => todo.status === "pending");
        const inProgress = todos.filter(todo => todo.status === "in-progress");
        const completed = todos.filter(todo => todo.status === "completed");

        // Check if all todos are completed
        if (pending.length === 0 && inProgress.length === 0) {
            await ctx.runMutation(internal.tasks.completeTask, {
                taskId,
            });

            return {
                isCompleted: true,
                message: `All todos completed! 🎉 Total: ${completed.length}/${todos.length}`,
            };
        }

        // There must be an in-progress todo (we just started one if there was a pending one)
        const currentTodo = inProgress[0];
        return {
            isCompleted: false,
            message: `Moved to next todo: "${currentTodo.title}" | Progress: ${completed.length}/${todos.length} completed, ${pending.length} remaining`,
        };
    },
});