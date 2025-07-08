import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "@/convex/_generated/api";

export const openMicroApp = createTool({
    description: "Open a micro app for viewing and interacting with specific data dashboards",
    args: z.object({
        name: z.enum(["kpi-dashboard", "company-config", "employee-config"]),
        title: z.string().optional().describe("Custom title for the micro app"),
    }),
    handler: async (ctx, args, { toolCallId }) => {
        if (!ctx.threadId) throw new Error("Thread ID is required");
        if (!ctx.userId) throw new Error("User ID is required");
        if (!ctx.messageId) throw new Error("Message ID is required");

        const { name, title } = args;

        // Create a micro-app artifact entry
        const microAppTitle = title || {
            "kpi-dashboard": "KPI Dashboard",
            "company-config": "Company Configuration",
            "employee-config": "Employee Configuration"
        }[name];

        // Create the micro-app artifact
        const artifactId = await ctx.runMutation(internal.artifacts.createArtifact, {
            artifactGroupId: toolCallId, // Use toolCallId as unique groupId
            version: 1,
            title: microAppTitle,
            kind: "micro-app",
            employeeId: ctx.userId,
            toolCallId,
        });

        // Set the content to indicate which micro-app type this is
        await ctx.runMutation(internal.artifacts.handleArtifactTextChunk, {
            artifactId,
            content: JSON.stringify({
                type: name,
                title: microAppTitle,
                toolCallId,
            }),
        });

        return {
            message: `Opening ${microAppTitle} micro app`,
            artifactId,
            toolCallId,
            microAppType: name,
        };
    },
})