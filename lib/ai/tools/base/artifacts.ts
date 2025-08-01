import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "@/convex/_generated/api";
import { withToolErrorHandling } from "@/lib/ai/tool-utils";
import dedent from "dedent";
import { Id } from "@/convex/_generated/dataModel";

export const useArtifactsPrompt = dedent`
    <Use Artifacts Docs>
    Artifacts is a special user interface mode that helps users with writing, editing, and other content creation tasks. When artifact is open, it is on the right side of the screen, while the conversation is on the left side. When creating or updating documents, changes are reflected in real-time on the artifacts and visible to the user.

    When asked to write code, always use artifacts. When writing code, specify the language in the backticks, e.g. \`\`\`python\`code here\`\`\`. The default language is Python. Other languages are not yet supported, so let the user know if they request a different language.

    DO NOT UPDATE ARTIFACTS IMMEDIATELY AFTER CREATING THEM. WAIT FOR USER FEEDBACK OR REQUEST TO UPDATE IT.

    This is a guide for using artifacts tools: \`createArtifact\` and \`updateArtifact\`, which render content on a artifacts beside the conversation.

    **When to use \`createArtifact\`:**
    - For substantial content (>10 lines) or code
    - For content users will likely save/reuse (emails, code, essays, etc.)
    - When explicitly requested to create a document
    - For when content contains a single code snippet

    **When NOT to use \`createArtifact\`:**
    - For informational/explanatory content
    - For conversational responses
    - When asked to keep it in chat

    **Using \`updateArtifact\`:**
    - Default to full document rewrites for major changes
    - Use targeted updates only for specific, isolated changes
    - Follow user instructions for which parts to modify

    **When NOT to use \`updateArtifact\`:**
    - Immediately after creating a artifact

    Do not update artifact right after creating it. Wait for user feedback or request to update it.
    </Use Artifacts Docs>
`;

export type ArtifactResult = {
    artifactGroupId: string;
    title: string;
    kind: "text" | "sheet" | "code" | "image" | "video" | "music";
    content: string;
}

// Generalized entrypoint to create an artifact
// Could be text, sheet, code, image, video, audio, workflows, etc
export const createArtifact = createTool({
    description: "Create a artifact for a activities that need to generate some form of content output. This tool will call other functions that will generate the contents of the document based on the title and kind of artifact.",
    args: z.object({
        title: z.string().describe("The title of the artifact"),
        type: z.enum(["text", "sheet", "code", "image", "video", "music"]).describe("The type of the artifact"),
        generationPrompt: z.string().describe("The prompt to generate the artifact, you should be as specific as possible with what you want to generate")
    }),
    handler: async (ctx, args, { toolCallId }): Promise<ArtifactResult> => {
        return withToolErrorHandling(
            async () => {
                if (!ctx.threadId) throw new Error("Thread ID is required");
                if (!ctx.userId) throw new Error("User ID is required");
                if (!ctx.messageId) throw new Error("Message ID is required");

                const { title, type, generationPrompt } = args;

                const backgroundJobStatusId = await ctx.runMutation(internal.backgroundJobStatuses.createBackgroundJobStatus, {
                    toolCallId,
                    threadId: ctx.threadId,
                    toolName: "createArtifact",
                    toolParameters: args,
                });

                // Not sure which artifact needs to be in the background yet, but it should be useful for longer running artifacts
                const artifact = await ctx.runAction(internal.artifacts.generateArtifact, {
                    threadId: ctx.threadId,
                    employeeId: ctx.userId,
                    title: title,
                    kind: type,
                    generationPrompt: generationPrompt,
                    toolCallId,
                    backgroundJobStatusId,
                });

                return artifact;
            },
            {
                operation: "Artifact creation",
                includeTechnicalDetails: true
            },
            (artifact) => ({
                message: `Artifact created successfully.`,
                ...artifact,
                toolCallId: toolCallId
            })
        );
    },
})

export const updateArtifact = createTool({
    description: "Update a artifact, this will generate a new artifact with the same group id and version as the existing artifact. This is useful if you want to update the artifact with new information or changes. This is a background job, you will receive a job id and the results when it is available.",
    args: z.object({
        artifactGroupId: z.string().describe("The group id of the artifact to update"),
        title: z.string().describe("The title of the artifact"),
        kind: z.enum(["text", "sheet", "code", "image", "video", "music"]).describe("The kind of the artifact"),
        generationPrompt: z.string().describe("The prompt to generate the artifact, you should be as specific as possible with what you want to generate"),
    }),
    handler: async (ctx, args, { toolCallId }): Promise<ArtifactResult> => {
        return withToolErrorHandling(
            async () => {
                if (!ctx.threadId) throw new Error("Thread ID is required");
                if (!ctx.userId) throw new Error("User ID is required");
                if (!ctx.messageId) throw new Error("Message ID is required");

                const { artifactGroupId, title, kind, generationPrompt } = args;

                const backgroundJobStatusId = await ctx.runMutation(internal.backgroundJobStatuses.createBackgroundJobStatus, {
                    toolCallId,
                    threadId: ctx.threadId,
                    toolName: "updateArtifact",
                    toolParameters: args,
                });

                const artifact = await ctx.runAction(internal.artifacts.generateArtifact, {
                    existingArtifactGroupId: artifactGroupId,
                    threadId: ctx.threadId,
                    employeeId: ctx.userId,
                    title,
                    kind,
                    generationPrompt,
                    toolCallId,
                    backgroundJobStatusId,
                });

                return artifact;
            },
            {
                operation: "Artifact update",
                includeTechnicalDetails: true
            },
            (artifact) => ({
                message: `Artifact updated successfully.`,
                ...artifact,
                toolCallId: toolCallId
            })
        );
    },
})