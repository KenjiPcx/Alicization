import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "@/convex/_generated/api";

// Generalized entrypoint to create an artifact
// Could be text, sheet, code, image, video, audio, workflows, etc
export const createArtifact = createTool({
    description: "Create a artifact for a activities that need to generate some form of content output. This tool will call other functions that will generate the contents of the document based on the title and kind of artifact. This is a background job, you will receive a job id and the results when it is available. After calling this tool, you can continue doing other things or just end your turn.",
    args: z.object({
        title: z.string().describe("The title of the artifact"),
        type: z.enum(["text", "sheet", "code", "image", "video", "music"]).describe("The type of the artifact"),
        generationPrompt: z.string().describe("The prompt to generate the artifact, you should be as specific as possible with what you want to generate"),
    }),
    handler: async (ctx, args, { toolCallId }): Promise<string> => {
        if (!ctx.threadId) throw new Error("Thread ID is required");
        if (!ctx.userId) throw new Error("User ID is required");
        if (!ctx.messageId) throw new Error("Message ID is required");

        const { title, type, generationPrompt } = args;

        const backgroundJobStatusId = await ctx.runMutation(internal.backgroundJobStatuses.createBackgroundJobStatus, {
            toolCallId,
            threadId: ctx.threadId,
            messageId: ctx.messageId,
            toolName: "createArtifact",
            toolParameters: args,
        });

        // Not sure which artifact needs to be in the background yet, but it should be useful for longer running artifacts
        const jobId = await ctx.runAction(internal.artifacts.scheduleArtifactGeneration, {
            threadId: ctx.threadId,
            employeeId: ctx.userId,
            messageId: ctx.messageId,
            title: title,
            kind: type,
            generationPrompt: generationPrompt,
            toolCallId,
            backgroundJobStatusId,
        });
        return `Artifact scheduled to be created in the background with job id: ${jobId}. Will notify you when it is ready.`;
    },
})

export const updateArtifact = createTool({
    description: "Update a artifact, this will generate a new artifact with the same group id and version as the existing artifact. This is useful if you want to update the artifact with new information or changes. This is a background job, you will receive a job id and the results when it is available. After calling this tool, you can continue doing other things or just end your turn.",
    args: z.object({
        artifactGroupId: z.string().describe("The group id of the artifact to update"),
        title: z.string().describe("The title of the artifact"),
        kind: z.enum(["text", "sheet", "code", "image", "video", "music"]).describe("The kind of the artifact"),
        generationPrompt: z.string().describe("The prompt to generate the artifact, you should be as specific as possible with what you want to generate"),
    }),
    handler: async (ctx, args, { toolCallId }): Promise<string> => {
        if (!ctx.threadId) throw new Error("Thread ID is required");
        if (!ctx.userId) throw new Error("User ID is required");
        if (!ctx.messageId) throw new Error("Message ID is required");

        const { artifactGroupId, title, kind, generationPrompt } = args;

        const backgroundJobStatusId = await ctx.runMutation(internal.backgroundJobStatuses.createBackgroundJobStatus, {
            toolCallId,
            threadId: ctx.threadId,
            messageId: ctx.messageId,
            toolName: "createArtifact",
            toolParameters: args,
        });

        const jobId = await ctx.runAction(internal.artifacts.scheduleArtifactGeneration, {
            artifactGroupId,
            threadId: ctx.threadId,
            employeeId: ctx.userId,
            messageId: ctx.messageId,
            title,
            kind,
            generationPrompt,
            toolCallId,
            backgroundJobStatusId,
        });

        return `Artifact group ${artifactGroupId} scheduled to be updated in the background with job id: ${jobId}. Will notify you when it is ready.`;
    },
})