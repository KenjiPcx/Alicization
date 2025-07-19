import { WorkflowId } from "@convex-dev/workflow";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { ActionCtx } from "./_generated/server";
import { workflow } from "./setup";

/**
 * Chat workflow that orchestrates the entire chat system:
 * 1. Handles initial user message (saves it and processes it)
 * 2. Checks if agent created a task with todos
 * 3. If task exists, continuously processes todos until completion
 * Multiple todos are handled within one action
 */
export const chatWorkflow = workflow.define({
    args: {
        chatConfig: v.union(v.object({
            type: v.literal("start-chat"),
            promptMessageId: v.string(),
        }), v.object({
            type: v.literal("continue-task"),
            prompt: v.string(),
        })),
        threadId: v.string(),
        userId: v.id("users"),
        employeeId: v.id("employees"),
        teamId: v.id("teams"),
    },
    handler: async (step, args): Promise<{ status: string; message: string; todoProcessingRound?: number }> => {
        const { threadId, userId, employeeId, teamId, chatConfig } = args;

        // Step 1: Handle the initial user message
        // This is the first action that has a 10min timeout / 25 steps timeout
        // This saves the message as a user message and processes it
        console.log("[ChatWorkflow] Initial message started");
        await step.runAction(internal.chatNode.streamMessage, {
            threadId,
            userId,
            employeeId,
            teamId,
            promptMessageId: chatConfig.type === "start-chat" ? chatConfig.promptMessageId : undefined,
            prompt: chatConfig.type === "continue-task" ? chatConfig.prompt : undefined,
            blocking: true,
        }, {
            retry: false,
            name: "Initial message",
        });
        console.log("[ChatWorkflow] Initial message ended");

        while (true) {
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

            // If task is blocked, we can end the turn here, chat will be continued in the next turn
            if (task.status === "blocked") {
                console.log("[ChatWorkflow:task] Task is blocked, ending turn");
                return { status: "blocked", message: "Task is blocked, ending turn" };
            }

            // If task is completed, we can end the turn here
            else if (task.status === "completed") {
                console.log("[ChatWorkflow:task] Task is completed, ending turn");
                return { status: "completed", message: "Task completed" };
            }

            else {
                // TODO: We can always compress context here, since we probably don't need the full 10mins worth of context
                // If task is in progress, we give the agent another 10mins/25ConfiguredSteps to complete the task
                console.log("[ChatWorkflow] Task is in progress, continuing turn");
                await step.runAction(internal.chatNode.streamMessage, {
                    threadId,
                    userId,
                    employeeId,
                    teamId,
                    prompt: `Continue working on the task.`,
                    blocking: true,
                }, {
                    retry: false,
                    name: "Continue working on the task",
                });
            }
        }
    },
});

export const cleanupWorkflowHelper = async (ctx: ActionCtx, workflowId: WorkflowId) => {
    try {
        while (true) {
            const status = await workflow.status(ctx, workflowId);
            if (status.type === "inProgress") {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                continue;
            }
            break;
        }
    } finally {
        await workflow.cleanup(ctx, workflowId);
    }
}