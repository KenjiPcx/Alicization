import { employeeAgent } from "@/lib/ai/agents/employee-agent";
import { internal, api } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, query, internalAction, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const createTask = internalMutation({
    args: v.object({
        threadId: v.string(),
        title: v.string(),
        description: v.string(),
        plan: v.string(),
        todos: v.array(v.string()),
        context: v.optional(v.object({
            employeeId: v.id("employees"),
            teamId: v.id("teams"),
            userId: v.id("users"),
        })),
    }),
    handler: async (ctx, args) => {
        const { threadId, title, description, plan, todos, context } = args;

        const taskId = await ctx.db.insert("tasks", {
            threadId,
            title,
            description,
            plan: [plan],
            todos: todos.map((todo) => ({
                title: todo,
                status: "pending" as const,
            })),
            context,
            status: "in-progress" as const,
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

        await ctx.db.patch(taskId, { status: "completed" });

        return `Task completed!`;
    },
});

/**
 * Get the most recent task for the threadId
 */
export const getLatestTask = query({
    args: v.object({
        threadId: v.string(),
    }),
    handler: async (ctx, args) => {
        const { threadId } = args;

        const task = await ctx.db
            .query("tasks")
            .filter((q) => q.and(
                q.eq(q.field("threadId"), threadId),
                q.or(
                    q.eq(q.field("status"), "in-progress"),
                    q.eq(q.field("status"), "blocked")
                )
            ))
            .order("desc")
            .first();

        return task;
    },
});

export const internalGetLatestTask = internalQuery({
    args: v.object({
        threadId: v.string(),
    }),
    handler: async (ctx, args) => {
        const { threadId } = args;

        const task = await ctx.db
            .query("tasks")
            .filter((q) => q.and(
                q.eq(q.field("threadId"), threadId),
                q.or(
                    q.eq(q.field("status"), "in-progress"),
                    q.eq(q.field("status"), "blocked")
                )
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
            return {
                message: "No pending todos to start",
                task: {
                    ...task,
                    todos: todos,
                }
            };
        }

        todos[pendingIndex] = {
            ...todos[pendingIndex],
            status: "in-progress" as const,
        };

        await ctx.db.patch(taskId, { todos });

        return {
            message: `Started todo: "${todos[pendingIndex].title}"`,
            task: {
                ...task,
                todos: todos,
            }
        };
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
            return {
                isCompleted: false, // Don't automatically complete, let agent decide
                message: `All todos completed! 🎉 Total: ${completed.length}/${todos.length}. Use setTaskStatus tool to mark task as complete or add more todos if needed.`,
                task: {
                    ...task,
                    todos: todos,
                }
            };
        }

        // Generate appropriate message
        let message = "";
        if (inProgressIndex !== -1 && pendingIndex !== -1) {
            message = `Completed "${todos[inProgressIndex].title}" ✅ Started "${todos[pendingIndex].title}" ➡️ Progress: ${completed.length}/${todos.length}`;
        } else if (inProgressIndex !== -1) {
            message = `Completed "${todos[inProgressIndex].title}" ✅ Progress: ${completed.length}/${todos.length}`;
        } else if (pendingIndex !== -1) {
            message = `Started "${todos[pendingIndex].title}" ➡️ Progress: ${completed.length}/${todos.length}`;
        } else {
            message = `No changes made. Progress: ${completed.length}/${todos.length}`;
        }

        return {
            isCompleted: false,
            message,
            task: {
                ...task,
                todos: todos,
            }
        };
    },
});

/**
 * Set the task status with a reason
 */
export const setTaskStatus = internalMutation({
    args: v.object({
        taskId: v.id("tasks"),
        status: v.union(v.literal("in-progress"), v.literal("completed"), v.literal("blocked")),
        reason: v.string(),
    }),
    handler: async (ctx, args) => {
        const { taskId, status, reason } = args;

        const task = await ctx.db.get(taskId);
        if (!task) {
            throw new Error("Task not found");
        }

        await ctx.db.patch(taskId, { status });

        console.log(`Task ${taskId} status updated to "${status}": ${reason}`);

        return `Task status updated to "${status}": ${reason}`;
    },
});

// Public query to fetch a specific task by ID
export const getTaskById = query({
    args: v.object({
        taskId: v.id("tasks"),
    }),
    handler: async (ctx, args) => {
        const { taskId } = args;
        return await ctx.db.get(taskId);
    },
});

// Get the most recent completed task for the threadId
export const getLastCompletedTask = query({
    args: v.object({
        threadId: v.string(),
    }),
    handler: async (ctx, args) => {
        const { threadId } = args;

        const task = await ctx.db
            .query("tasks")
            .filter((q) => q.and(
                q.eq(q.field("threadId"), threadId),
                q.eq(q.field("status"), "completed")
            ))
            .order("desc")
            .first();

        return task;
    },
});

// Reactivate a completed task and add new todos
export const reactivateAndUpdateTask = internalMutation({
    args: v.object({
        taskId: v.id("tasks"),
        newPlan: v.string(),
        newTodos: v.array(v.string()),
    }),
    handler: async (ctx, args) => {
        const { taskId, newPlan, newTodos } = args;

        const existingTask = await ctx.db.get(taskId);
        if (!existingTask) {
            throw new Error("Task not found");
        }

        // Append new plan to the plan array
        const updatedPlanArray = [...existingTask.plan, newPlan];

        // Add new todos to existing todos
        const newTodoObjects = newTodos.map((todo) => ({
            title: todo,
            status: "pending" as const,
        }));

        const updatedTodos = [...existingTask.todos, ...newTodoObjects];

        // Reactivate the task by setting status to in-progress
        await ctx.db.patch(taskId, {
            plan: updatedPlanArray,
            todos: updatedTodos,
            status: "in-progress" as const,
        });

        return await ctx.db.get(taskId) as Doc<"tasks">;
    },
});

export const addTodoToTask = internalMutation({
    args: v.object({
        taskId: v.id("tasks"),
        todo: v.string(),
    }),
    handler: async (ctx, args) => {
        const { taskId, todo } = args;

        const task = await ctx.db.get(taskId);
        if (!task) throw new Error("Task not found");

        // Skip the completed todos, add the new one after all completed todos
        const todos = [...task.todos];
        const completedTodos = todos.filter(todo => todo.status === "completed");
        const pendingTodos = todos.filter(todo => todo.status === "pending");

        const updatedTodos = [...completedTodos, {
            title: todo,
            status: "pending" as const,
        }, ...pendingTodos];

        const updateData: any = { todos: updatedTodos };

        // If task is blocked, unblock it when new todos are added
        if (task.status === "blocked") {
            updateData.status = "in-progress";
            console.log(`Task ${taskId} was blocked, now unblocking due to new todo: ${todo}`);
        }

        await ctx.db.patch(taskId, updateData);
    },
});
