import { components, internal } from "@/convex/_generated/api";
import { Agent } from "@convex-dev/agent";
import { model } from "@/lib/ai/model";
import dedent from "dedent";
import { internalAction } from "@/convex/_generated/server";
import { smoothStream, streamText } from "ai";
import { artifactGeneratorArgsValidator } from "./utils";

const writerPrompt = dedent`
    You are an expert writer. Write about the given topic. Markdown is supported. Use headings wherever appropriate.
`

export const writerAgent = new Agent(components.agent, {
    name: "Writer Agent",
    chat: model,
    instructions: writerPrompt,
    contextOptions: {
        searchOptions: {
            textSearch: true,
            vectorSearch: true,
            limit: 5,
        }
    },
    storageOptions: {
        saveAnyInputMessages: false,
        saveOutputMessages: false,
    }
});

export const generateTextArtifact = internalAction({
    args: artifactGeneratorArgsValidator,
    handler: async (ctx, args) => {
        const { artifactId, threadId, userId, prompt, latestArtifactContent, backgroundJobStatusId } = args;

        await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
            backgroundJobStatusId,
            status: "running",
            message: "Processing the requirements...",
            progress: 25,
        });

        const { fullStream } = await writerAgent.streamText(ctx, {
            threadId,
            userId,
        }, {
            prompt: latestArtifactContent ? dedent`
                The current artifact is: ${latestArtifactContent}
                Update the artifact with the following feedback: 
                ${prompt}
            ` : prompt,
            experimental_transform: smoothStream({
                delayInMs: 1500,
                chunking: "line",
            })
        })

        let draftContent = "";
        let encounteredReasoning = false;
        let encounteredTextDelta = false;
        // Wait for the stream to finish
        // These mutations will persist the changes to the artifact in the database
        for await (const chunk of fullStream) {
            if (chunk.type === "reasoning") {

                // We want to update the tool status with the progress of the reasoning phase
                if (!encounteredReasoning) {
                    await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
                        backgroundJobStatusId,
                        status: "running",
                        message: "Planning to write the best possible artifact...",
                        progress: 50,
                    });
                    encounteredReasoning = true;
                }

            } else if (chunk.type === "text-delta") {

                // Same with the text delta phase
                if (!encounteredTextDelta) {
                    await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
                        backgroundJobStatusId,
                        status: "running",
                        message: "Writing the artifact...",
                        progress: 75,
                    });
                    encounteredTextDelta = true;
                }

                draftContent += chunk.textDelta;
                await ctx.runMutation(internal.artifacts.handleArtifactTextChunk, {
                    artifactId,
                    content: chunk.textDelta,
                });
            }
        }

        return draftContent;
    },
});
