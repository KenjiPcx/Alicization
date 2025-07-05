/**
 * Planner toolset
 * One plan per threadId, the AI will first create a plan if the thread does not have one
 * - Update plan (replanning)
 * - Select next todo: Check off current todo if current todo in progress, and select the next todo
 */

import { z } from "zod";
import { createTool } from "@convex-dev/agent";
import { internal } from "@/convex/_generated/api";
import dedent from "dedent";

export const usePlannerToolsPrompt = dedent`
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
`

/**
 * Set or update the plan and todos for this thread
 * Supports replanning by appending to existing plan arrays
 */
export const setPlanAndTodos = createTool({
    description: "Set or update the plan and todos for a turn within a multiturn conversation. You can call this tool again when you replan and want to add more todos or change the plan, they will get appended to the existing plan and todos for this turn, don't provide a title and description when you do",
    args: z.object({
        title: z.optional(z.string().describe("The title of the user task, this will be used to create the plan title")),
        description: z.optional(z.string().describe("The description of the user task, this will be used to create the plan description")),
        plan: z.string().describe("The current plan to accomplish the user goal"),
        todos: z.array(z.string()).describe("The remaining todos to accomplish the plan, these will be added to any existing incomplete todos")
    }),
    handler: async (ctx, args): Promise<string> => {
        const threadId = ctx.threadId;
        if (!threadId) throw new Error("Thread ID is required");

        const { plan, todos, title, description } = args;

        const latestTask = await ctx.runQuery(internal.tasks.getLatestTask, {
            threadId,
        });

        if (latestTask) {
            // Update existing plan (replanning)
            const updatedTask = await ctx.runMutation(internal.tasks.updateTask, {
                taskId: latestTask._id,
                newPlan: plan,
                newTodos: todos,
            });

            return `Replanned successfully! Added ${todos.length} new todos to existing plan.`;
        }

        if (!title || !description) {
            return "Title and description are required to create a new plan";
        }

        // Create a new plan and todos
        const newTask = await ctx.runMutation(internal.tasks.createTask, {
            threadId,
            title,
            description,
            plan,
            todos,
        });

        return `Created new task "${newTask.title}" with ${todos.length} todos.`;
    },
});

export const selectNextTodo = createTool({
    description: "Select the next todo to work on, selects the first pending todo to work on. Call this tool before proceeding to the next todo, it updates the UI for the user to track your progress",
    args: z.object({}),
    handler: async (ctx, args): Promise<string> => {
        const threadId = ctx.threadId;
        if (!threadId) throw new Error("Thread ID is required");

        const latestTask = await ctx.runQuery(internal.tasks.getLatestTask, {
            threadId,
        });

        if (!latestTask) return "No task exists for this thread.";

        const nextTodo = latestTask.todos.find(todo => todo.status === "pending");
        if (!nextTodo) return "No pending todos found. All todos are completed. Please summarize your work to the user";

        // Actually start the todo by changing its status to "in-progress"
        const result = await ctx.runMutation(internal.tasks.startNextTodo, {
            taskId: latestTask._id,
        });

        return result;
    },
});

/**
 * Move to the next todo (complete current and start next)
 */
export const completeCurrentTodoAndMoveToNextTodo = createTool({
    description: "Complete the current todo and move to the next one",
    args: z.object({}),
    handler: async (ctx, args): Promise<string> => {
        const threadId = ctx.threadId;
        if (!threadId) throw new Error("Thread ID is required");

        const currentTask = await ctx.runQuery(internal.tasks.getLatestTask, {
            threadId,
        });

        if (!currentTask) {
            return "No task exists for this thread.";
        }

        const result = await ctx.runMutation(internal.tasks.completeCurrentTodoAndMoveToNextTodo, {
            taskId: currentTask._id,
        });

        return result.message;
    },
});

export const plannerTools = {
    setPlanAndTodos,
    selectNextTodo,
    completeCurrentTodoAndMoveToNextTodo
}