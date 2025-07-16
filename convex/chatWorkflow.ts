import { WorkflowManager } from "@convex-dev/workflow";
import { components, internal } from "./_generated/api";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

export const workflow = new WorkflowManager(components.workflow);

/**
 * Chat workflow that orchestrates the entire chat system:
 * 1. Handles initial user message (saves it and processes it)
 * 2. Checks if agent created a task with todos
 * 3. If task exists, continuously processes todos until completion
 * 4. Handles dynamic todo additions during execution
 */
export const chatWorkflow = workflow.define({
    args: {
        promptMessageId: v.string(),
        threadId: v.string(),
        userId: v.id("users"),
        employeeId: v.id("employees"),
        teamId: v.id("teams"),
    },
    handler: async (step, args): Promise<{ status: string; message: string; todoProcessingRound?: number }> => {
        const { threadId, userId, employeeId, teamId, promptMessageId } = args;

        // Step 1: Handle the initial user message
        // This saves the message as a user message and processes it
        console.log("[ChatWorkflow] Initial message started");
        await step.runAction(internal.chatNode.streamMessage, {
            threadId,
            userId,
            employeeId,
            teamId,
            promptMessageId,
            blocking: true,
        });
        console.log("[ChatWorkflow] Initial message ended");

        // Step 2: Check if a task was created during the initial processing
        // Fetch the task every turn in case replan happens or new todos are added externally
        let task: Doc<"tasks"> | null = await step.runQuery(internal.tasks.internalGetLatestTask, {
            threadId,
        });

        // If no task was created, the conversation is complete
        if (!task) {
            console.log("[ChatWorkflow:task] No task created, conversation is complete");
            return { status: "completed", message: "Simple chat completed" };
        }
        
        // Step 3: Task exists - continuously process todos
        while (task && task.todos && task.todos.some(todo => todo.status !== "completed")) {
            console.log("[ChatWorkflow:task] Task exists, processing todos");

            // Get next todo
            const nextTodo = task.todos.find(todo => todo.status !== "completed");
            if (!nextTodo) {
                console.log("[ChatWorkflow:task] No todos found, conversation is complete");
                return { status: "completed", message: "Simple chat completed" };
            }

            // Execute the todo
            console.log("[ChatWorkflow:task] Executing todo", nextTodo.title);
            console.log("[ChatWorkflow:task] Stream message started");
            await step.runAction(internal.chatNode.streamMessage, {
                threadId,
                userId,
                employeeId,
                teamId,
                prompt: `Perform the next todo: ${nextTodo.title}`,
                blocking: true,
            });
            console.log("[ChatWorkflow:task] Stream message ended");

            // If all todos are completed, break
            task = await step.runQuery(internal.tasks.internalGetLatestTask, {
                threadId,
            });
        }

        return {
            status: "completed",
            message: `Task completed`,
        };
    },
});