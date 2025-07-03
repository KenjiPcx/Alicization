import { Agent } from "@convex-dev/agent";
import { model } from "@/lib/ai/model";
import dedent from "dedent";
import { internalAction } from "@/convex/_generated/server";
import { smoothStream } from "ai";
import { components, internal } from "@/convex/_generated/api";
import { artifactGeneratorArgsValidator } from "./utils";

const sheetWriterPrompt = dedent`
    You are a spreadsheet creation assistant. Create a spreadsheet in csv format based on the given prompt. The spreadsheet should contain meaningful column headers and data.
`;

export const sheetWriterAgent = new Agent(components.agent, {
    name: "Sheet Writer Agent",
    chat: model,
    instructions: sheetWriterPrompt,
});


export const generateSheetArtifact = internalAction({
    args: artifactGeneratorArgsValidator,
    handler: async (ctx, args) => {
        const { artifactId, threadId, userId, prompt, latestArtifactContent, backgroundJobStatusId } = args;

        await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
            backgroundJobStatusId,
            status: "running",
            message: "Processing the requirements...",
            progress: 25,
        });

        const { fullStream } = await sheetWriterAgent.streamText(ctx, {
            threadId,
            userId,
        }, {
            prompt: latestArtifactContent ? dedent`
                The current artifact is: ${latestArtifactContent}
                Update the artifact with the following feedback: 
                ${prompt}
            ` : prompt,
            experimental_transform: smoothStream({
                delayInMs: 100,
                chunking: "line",
            }),
        }, {
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
        })

        let draftContent = "";
        let encounteredReasoning = false;
        let encounteredTextDelta = false;
        // Wait for the stream to finish
        // These mutations will persist the changes to the artifact in the database
        for await (const chunk of fullStream) {
            if (chunk.type === "reasoning") {
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