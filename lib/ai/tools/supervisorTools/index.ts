// <Supervisor Tools>
// Create plan creates a task sorta thing within a session, one session can have multiple tasks

import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import type { Doc } from "../../../_generated/dataModel";
import { internal } from "../../../_generated/api";
import { updateThreadTitle } from "./updateThreadTitle";

// useful for clearing the existing todo list, in a sense new todos belong to a separate task, depending on the context
export const createPlanAndTodos = createTool({
    description: "Create a plan of todos to accomplish a large scope task. The todos on this list shouldn't be granular, they should contain high level steps only as each todo will be executed by a subagent which will have its own internal plan. Call this tool when a complex task is presented in the thread with no existing plan, or when a new different complex task is presented in the thread",
    args: z.object({
        title: z.string().describe("The title of the task"),
        description: z.string().describe("The description of the task"),
        plan: z.string().describe("The plan of the task, this is a high level plan of the task, not a detailed plan of the task"),
        todos: z.array(z.string()).describe("The todos of the task"),
    }),
    handler: async (ctx, args) => {
        const { title, description, plan, todos } = args;

        if (!ctx.threadId) {
            throw new Error("Thread ID is required");
        }

        const createdPlan: Doc<"plans"> = await ctx.runMutation(internal.plans.createPlan, {
            threadId: ctx.threadId,
            title,
            description,
            plan,
            todos,
        });

        return `Successfully created plan: \n${JSON.stringify(createdPlan, null, 2)}`;
    },
})

// Update plan updates the plan of a task, not creates a new one
export const updatePlanOrTodos = createTool({
    description: "Call this after you have reviewed a todo execution. This tool updates the plan or todos of the current thread, or check off the current todo",
    args: z.object({
        updatedPlan: z.string().optional().describe("The updated plan of the task, provide to replace the current plan, if not provided, the current plan will be kept"),
        updatedPendingTodos: z.array(z.string()).optional().describe("Todos that should be done right after the current todo, if not provided, the current todo will be kept"),
        checkOffCurrentTodo: z.boolean().default(true).describe("Check off the current todo, if provided, the current todo will be checked off, if not provided, the current todo will be kept"),
    }),
    handler: async (ctx, args): Promise<string> => {
        const { updatedPlan, updatedPendingTodos, checkOffCurrentTodo } = args;

        if (!ctx.threadId) throw new Error("Thread ID is required");

        try {
            const updatedPlanDoc = await ctx.runMutation(internal.plans.updatePlan, {
                threadId: ctx.threadId,
                updatedPlan: updatedPlan,
                updatedPendingTodos: updatedPendingTodos,
                checkOffCurrentTodo: checkOffCurrentTodo,
            });
            return `Successfully updated plan:\n${JSON.stringify({
                title: updatedPlanDoc?.title,
                plan: updatedPlanDoc?.plan,
                completedTodos: updatedPlanDoc?.completedTodos,
                pendingTodos: updatedPlanDoc?.pendingTodos,
            }, null, 2)}`;
        } catch (error) {
            if (error instanceof Error) {
                return `Error updating plan: ${error.message}`;
            }
            return `Error updating plan: ${error}`;
        }
    },
})

// Will be done as a background task
// Handoff to a subagent and it will hand back the result when done
export const executeTodo = createTool({
    description: "Execute a todo, launches a background task to execute the current todo",
    args: z.object({
        todoId: z.string().describe("The id of the todo to execute"),
    }),
    handler: async (ctx, args): Promise<string> => {

        return "Todo executed";
    },
})

// Schedule a task to be executed later
// Could be a cron job, a delayed task, a background task, etc.
export const scheduleTask = createTool({
    description: "Schedule a task",
    args: z.object({
        task: z.string().describe("The task to schedule"),
    }),
    handler: async (ctx, args): Promise<string> => {
        // Schedule a task
        return "Task scheduled";
    },
})

// Save a memory to the memory store
// Could be a memory of a conversation, a memory of a task, a memory of a decision, etc.
// More on user preferences, etc.
export const saveMemory = createTool({
    description: "Save a memory to the memory store",
    args: z.object({
        memory: z.string().describe("The memory to save"),
    }),
    handler: async (ctx, args): Promise<string> => {
        // Save a memory to the memory store
        return "Memory saved";
    },
})

// Create a chat with other agents in the office
export const createChat = createTool({
    description: "Create a chat",
    args: z.object({
        title: z.string().describe("The title of the chat"),
    }),
    handler: async (ctx, args): Promise<string> => {
        // Create a chat
        return "Chat created";
    },
})

// Let the supervisor know that a tool is missing
// More like giving feedback on what is missing to execute a task
export const raiseMissingToolRequest = createTool({
    description: "Raise a tool request, when planning a task, and you feel like you don't have the right tools to execute the task, use this tool to raise a request to the user or the company to add the missing tools",
    args: z.object({
        tool: z.string().describe("The tool to request"),
    }),
    handler: async (ctx, args): Promise<string> => {
        // Raise a tool request
        return "Tool request raised";
    },
})

// </Supervisor Tools>

export const supervisorTools = {
    createPlanAndTodos,
    updatePlanOrTodos,
    executeTodo,
    scheduleTask,
    saveMemory,
    createChat,
    raiseMissingToolRequest,
    updateThreadTitle,
}