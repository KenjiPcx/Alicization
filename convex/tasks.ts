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
                q.eq(q.field("done"), false)
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
            await ctx.runMutation(internal.tasks.completeTask, {
                taskId,
            });

            return {
                isCompleted: true,
                message: `All todos completed! 🎉 Total: ${completed.length}/${todos.length}`,
                task: {
                    ...task,
                    todos: todos,
                }
            };
        }

        // There must be an in-progress todo (we just started one if there was a pending one)
        const currentTodo = inProgress[0];
        return {
            isCompleted: false,
            message: `Moved to next todo: "${currentTodo.title}" | Progress: ${completed.length}/${todos.length} completed, ${pending.length} remaining`,
            task: {
                ...task,
                todos: todos,
            }
        };
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
                q.eq(q.field("done"), true)
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

        // Reactivate the task by setting done to false
        await ctx.db.patch(taskId, {
            plan: updatedPlanArray,
            todos: updatedTodos,
            done: false,
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

        await ctx.db.patch(taskId, { todos: updatedTodos });
    },
});

// Schedule a watchdog to check task progress
export const scheduleTaskWatchdog = internalMutation({
    args: v.object({
        taskId: v.id("tasks"),
        delayMs: v.optional(v.number()), // Default to 10 minutes
    }),
    handler: async (ctx, args): Promise<Id<"_scheduled_functions">> => {
        const { taskId, delayMs = 10 * 60 * 1000 } = args; // 10 minutes default

        // Schedule new watchdog
        const scheduledFunctionId = await ctx.scheduler.runAfter(
            delayMs,
            internal.tasks.watchdogCheck,
            { taskId }
        );

        // Update task with new watchdog ID
        await ctx.db.patch(taskId, {
            watchdogScheduledFunctionId: scheduledFunctionId,
        });

        return scheduledFunctionId;
    },
});

// Cancel the watchdog for a task
export const cancelTaskWatchdog = internalMutation({
    args: v.object({
        taskId: v.id("tasks"),
    }),
    handler: async (ctx, args) => {
        const { taskId } = args;

        const task = await ctx.db.get(taskId);
        if (!task) {
            return; // Task doesn't exist, nothing to cancel
        }

        if (task.watchdogScheduledFunctionId) {
            await ctx.scheduler.cancel(task.watchdogScheduledFunctionId);
            await ctx.db.patch(taskId, {
                watchdogScheduledFunctionId: undefined,
            });
        }
    },
});

// Watchdog action that checks task progress and unstucks if needed
export const watchdogCheck = internalAction({
    args: v.object({
        taskId: v.id("tasks"),
    }),
    handler: async (ctx, args) => {
        const { taskId } = args;

        const task = await ctx.runQuery(api.tasks.getTaskById, { taskId });
        if (!task) {
            console.log(`Watchdog: Task ${taskId} not found, skipping`);
            return;
        }

        // If task is completed, no need to watchdog
        if (task.done) {
            console.log(`Watchdog: Task ${taskId} is completed, no need to watchdog`);
            return;
        }

        // Check if there's a todo in progress or pending
        const inProgressTodo = task.todos.find((todo: { title: string; status: "pending" | "in-progress" | "completed" }) => todo.status === "in-progress");
        console.log(`Watchdog: Task ${taskId} has in-progress todo "${inProgressTodo?.title}", continuing monitoring`);

        // Send unstuck message
        if (task.context) { // New feature to continue the task
            await ctx.scheduler.runAfter(0, internal.chatNode.streamMessage, {
                threadId: task.threadId,
                userId: task.context.userId,
                prompt: "Previous action timed out. Continuing the task from where it left off",
                employeeId: task.context.employeeId,
                teamId: task.context.teamId,
                blocking: false,
            });
        }

        // Todo is in progress, schedule another watchdog check
        await ctx.runMutation(internal.tasks.scheduleTaskWatchdog, {
            taskId,
            delayMs: 10 * 60 * 1000 // 10 minutes - full cycle
        });
    },
});