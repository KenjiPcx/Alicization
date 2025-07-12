/**
 * Planner toolset
 * One plan per threadId, the AI will first create a plan if the thread does not have one
 * - Update plan (replanning)
 * - Select next todo: Check off current todo if current todo in progress, and select the next todo
 */

import { z } from "zod";
import { createTool } from "@convex-dev/agent";
import { api, internal } from "@/convex/_generated/api";
import dedent from "dedent";
import { withToolErrorHandling } from "@/lib/ai/tool-utils";
import { tool } from "ai";
import { ActionCtx } from "@/convex/_generated/server";
import { Id } from "@/convex/_generated/dataModel";

export type PlannerToolResult = {
    success: boolean;
    message: string;
    taskId?: string;
    isCompleted?: boolean;
    task?: {
        title: string;
        description: string;
        plan?: string;
        todos: Array<{ title: string; status: "pending" | "in-progress" | "completed" }>;
    };
};

export const usePlannerToolsPrompt = dedent`
    <Use Planner Tools Docs>
    ## Todo List Toolset

    Use for large, multi-step tasks that need progress tracking.

    **Initial Planning:** When user gives a large task, call setPlanAndTodos with title, description, plan, and todos array.

    **Working Through Todos:** 
    1. Call selectNextTodo to mark next item as "in progress" and update UI
    2. Work on the todo using appropriate tools
    3. Call completeCurrentTodoAndMoveToNextTodo when complete with a todo item
    4. Repeat until all todos are completed
    5. Summarize all your work so far

    **Replanning:** Call setPlanAndTodos again with updated plan and remaining todos (omit title/description).

    **Key Rules:**
    - One todo list per user turn (fresh list for each new large task, this will automatically be handled for you, you just have to call the setPlanAndTodos tool)
    - Always call selectNextTodo once after successfully calling setPlanAndTodos
    - Use completeCurrentTodoAndMoveToNextTodo when finishing (not selectNextTodo again)

    **Example:** User asks to "Build auth system" → setPlanAndTodos → selectNextTodo → work → completeCurrentTodoAndMoveToNextTodo → repeat until it tells you that no todos are left → summarize all your work so far
    </Use Planner Tools Docs>
`

/**
 * Set or update the plan and todos for this thread
 * Supports replanning by appending to existing plan arrays
 */
export const createSetPlanAndTodosTool = (
    ctx: ActionCtx,
    threadId: string,
    employeeId: Id<"employees">,
    teamId: Id<"teams">,
    userId: Id<"users">
) => tool({
    description: "Set or update the plan and todos for a turn within a multiturn conversation. You can call this tool again when you replan and want to add more todos or change the plan, they will get appended to the existing plan and todos for this turn, don't provide a title and description when you do",
    parameters: z.object({
        title: z.optional(z.string().describe("The title of the user task, this will be used to create the plan title")),
        description: z.optional(z.string().describe("The description of the user task, this will be used to create the plan description")),
        plan: z.string().describe("The current plan to accomplish the user goal"),
        todos: z.array(z.string()).describe("The remaining todos to accomplish the plan, these will be added to any existing incomplete todos")
    }),
    execute: async (args): Promise<PlannerToolResult> => {
        return withToolErrorHandling(
            async () => {
                const { plan, todos, title, description } = args;

                const latestTask = await ctx.runQuery(api.tasks.getLatestTask, {
                    threadId,
                });

                // This gets the latest open task and add new todos to it
                if (latestTask) {
                    // Update existing plan (replanning)
                    const updatedTask = await ctx.runMutation(internal.tasks.updateTask, {
                        taskId: latestTask._id,
                        newPlan: plan,
                        newTodos: todos,
                    });

                    return {
                        taskId: latestTask._id,
                        task: {
                            title: updatedTask.title,
                            description: updatedTask.description,
                            todos: updatedTask.todos,
                        },
                        operation: 'replan'
                    };
                }

                // If we get here, that means that the agent is replanning even though the task was already completed
                // If no title/description provided, try to find the last completed task and reactivate it
                if (!title || !description) {
                    const lastCompletedTask = await ctx.runQuery(api.tasks.getLastCompletedTask, {
                        threadId,
                    });

                    if (lastCompletedTask) {
                        // Reactivate the completed task and add new todos
                        const reactivatedTask = await ctx.runMutation(internal.tasks.reactivateAndUpdateTask, {
                            taskId: lastCompletedTask._id,
                            newPlan: plan,
                            newTodos: todos,
                        });

                        return {
                            taskId: lastCompletedTask._id,
                            task: {
                                title: reactivatedTask.title,
                                description: reactivatedTask.description,
                                todos: reactivatedTask.todos,
                            },
                            operation: 'reactivate'
                        };
                    }

                    throw new Error("Title and description are required to create a new plan");
                }

                // Create a new plan and todos
                const newTask = await ctx.runMutation(internal.tasks.createTask, {
                    threadId,
                    title,
                    description,
                    plan,
                    todos,
                    context: {
                        employeeId,
                        teamId,
                        userId,
                    },
                });

                // Schedule watchdog for the new task (only once!)
                await ctx.runMutation(internal.tasks.scheduleTaskWatchdog, {
                    taskId: newTask._id,
                });

                return {
                    taskId: newTask._id,
                    task: {
                        title: newTask.title,
                        description: newTask.description,
                        todos: newTask.todos,
                        plan: newTask.plan[newTask.plan.length - 1],
                    },
                    operation: 'create'
                };
            },
            {
                operation: "Plan and todos management",
                includeTechnicalDetails: true
            },
            (result) => {
                if (result.operation === 'replan') {
                    return {
                        message: `Replanned successfully! Added ${args.todos.length} new todos to existing plan.`,
                        taskId: result.taskId,
                        task: result.task,
                    };
                } else if (result.operation === 'reactivate') {
                    return {
                        message: `Reactivated completed task and added ${args.todos.length} new todos.`,
                        taskId: result.taskId,
                        task: result.task,
                    };
                } else {
                    return {
                        message: `Created new task "${result.task.title}" with ${args.todos.length} todos.`,
                        taskId: result.taskId,
                        task: result.task,
                    };
                }
            }
        );
    },
});

export const selectNextTodo = createTool({
    description: "Select the next todo to work on, selects the first pending todo to work on. Call this tool before proceeding to the next todo, it updates the UI for the user to track your progress",
    args: z.object({}),
    handler: async (ctx): Promise<PlannerToolResult> => {
        return withToolErrorHandling(
            async () => {
                if (!ctx.threadId) throw new Error("Thread ID is required");

                const latestTask = await ctx.runQuery(api.tasks.getLatestTask, {
                    threadId: ctx.threadId,
                });

                if (!latestTask) {
                    return { message: "No task exists for this thread.", noTask: true };
                }

                const nextTodo = latestTask.todos.find(todo => todo.status === "pending");
                if (!nextTodo) {
                    return {
                        message: "No pending todos found. All todos are completed. Please summarize your work to the user",
                        taskId: latestTask._id,
                        task: {
                            title: latestTask.title,
                            description: latestTask.description,
                            todos: latestTask.todos,
                        },
                        noMoreTodos: true
                    };
                }

                // Actually start the todo by changing its status to "in-progress"
                const { message, task } = await ctx.runMutation(internal.tasks.startNextTodo, {
                    taskId: latestTask._id,
                });

                return {
                    message,
                    taskId: latestTask._id,
                    task: {
                        title: task.title,
                        description: task.description,
                        todos: task.todos,
                    },
                };
            },
            {
                operation: "Todo selection",
                includeTechnicalDetails: true
            },
            (result) => {
                if (result.noTask) {
                    return { message: result.message };
                } else if (result.noMoreTodos) {
                    return {
                        message: result.message,
                        taskId: result.taskId,
                        task: result.task,
                    };
                } else {
                    return {
                        message: result.message,
                        taskId: result.taskId,
                        task: result.task,
                    };
                }
            }
        );
    },
});

/**
 * Move to the next todo (complete current and start next)
 */
export const completeCurrentTodoAndMoveToNextTodo = createTool({
    description: "Complete the current todo and move to the next one",
    args: z.object({}),
    handler: async (ctx): Promise<PlannerToolResult> => {
        return withToolErrorHandling(
            async () => {
                if (!ctx.threadId) throw new Error("Thread ID is required");

                const currentTask = await ctx.runQuery(api.tasks.getLatestTask, {
                    threadId: ctx.threadId,
                });

                if (!currentTask) {
                    return { message: "No task exists for this thread.", noTask: true };
                }

                const { message, isCompleted, task } = await ctx.runMutation(internal.tasks.completeCurrentTodoAndMoveToNextTodo, {
                    taskId: currentTask._id,
                });

                // Only cancel watchdog when task is completely done
                if (isCompleted) {
                    await ctx.runMutation(internal.tasks.cancelTaskWatchdog, {
                        taskId: currentTask._id,
                    });
                }

                return {
                    message,
                    taskId: currentTask._id,
                    isCompleted,
                    task: {
                        title: task.title,
                        description: task.description,
                        todos: task.todos,
                    },
                };
            },
            {
                operation: "Todo completion",
                includeTechnicalDetails: true
            },
            (result) => {
                if (result.noTask) {
                    return { message: result.message };
                } else {
                    return {
                        message: result.message,
                        taskId: result.taskId,
                        isCompleted: result.isCompleted,
                        task: result.task,
                    };
                }
            }
        );
    },
});

export const createPlannerTools = (
    ctx: ActionCtx,
    threadId: string,
    userId: Id<"users">,
    employeeId: Id<"employees">,
    teamId: Id<"teams">,
) => {
    return {
        setPlanAndTodos: createSetPlanAndTodosTool(ctx, threadId, employeeId, teamId, userId),
        selectNextTodo,
        completeCurrentTodoAndMoveToNextTodo
    }
}