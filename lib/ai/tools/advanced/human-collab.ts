import { tool } from "ai";
import { z } from "zod";
import { internal, api } from "@/convex/_generated/api";
import { ResolveToolProps } from "../../tool-utils";

/**
 * Human Collaboration Tool
 * 
 * Use this tool when you need human input, approval, or review to proceed with a task.
 * The tool will:
 * 1. Create a visible request in the chat
 * 2. Store the request for tracking
 * 3. Block the current task until human responds
 * 4. When human responds with the requestRef, the task automatically resumes
 * 
 * Examples:
 * - "I need approval to delete these files"
 * - "Please review this code before I deploy it"
 * - "Which option would you prefer for the design?"
 * - "Do you want me to proceed with this action?"
 */
export const resolveHumanCollabTool = ({
    ctx,
    threadId,
    userId,
    employeeId,
}: ResolveToolProps) => tool({
    description: "Request input from a human user. Use this when you need approval, review, clarification, or additional information before proceeding. The task will pause until the human responds.",
    parameters: z.object({
        message: z.string().describe("Clear message describing what you need from the human"),
        type: z.enum(["approval", "review", "question", "permission"]).describe("Type of request - approval: yes/no decisions, review: feedback on work, question: clarification needed, permission: authorization to proceed"),
        context: z.optional(z.string()).describe("Additional context about why this input is needed or what depends on their response"),
    }),
    execute: async ({ message, type, context }) => {
        // Store the human request in the database for tracking
        await ctx.runMutation(internal.userTasks.createUserTask, {
            threadId,
            employeeId,
            userId,
            message,
            type,
            context: context || "",
            status: "pending",
        });

        // Create a user-facing message that will appear in the chat
        const emoji = {
            approval: "✋",
            review: "👀",
            question: "❓",
            permission: "🔐"
        }[type];

        const userMessage = `${emoji} **Human Input Requested** (${type})\n\n${message}${context ? `\n\n*Context: ${context}*` : ""}\n\n*Please respond*`;

        // TODO: Create an email or something here

        // Get the current task and block it
        const currentTask = await ctx.runQuery(api.tasks.getLatestTask, { threadId });
        if (currentTask) {
            await ctx.runMutation(internal.tasks.setTaskStatus, {
                taskId: currentTask._id,
                status: "blocked",
                reason: `Waiting for human ${type}: ${message}`,
            });
        }

        return {
            success: true,
            message: `Human ${type} request sent. Task paused until response received. User should respond with reference:`,
        };
    },
})