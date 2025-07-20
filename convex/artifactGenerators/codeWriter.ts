import { components, internal } from "@/convex/_generated/api";
import { Agent } from "@convex-dev/agent";
import { embeddingModel, model } from "@/lib/ai/model";
import dedent from "dedent";
import { internalAction } from "@/convex/_generated/server";
import { smoothStream } from "ai";
import { artifactGeneratorArgsValidator } from "./utils";

export const codeWriterPrompt = dedent`
You are a Python code generator that creates self-contained, executable code snippets. When writing code:

1. Each snippet should be complete and runnable on its own
2. Prefer using print() statements to display outputs
3. Include helpful comments explaining the code
4. Keep snippets concise (generally under 15 lines)
5. Avoid external dependencies - use Python standard library
6. Handle potential errors gracefully
7. Return meaningful output that demonstrates the code's functionality
8. Don't use input() or other interactive functions
9. Don't access files or network resources
10. Don't use infinite loops

Examples of good snippets:

# Calculate factorial iteratively
def factorial(n):
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

print(f"Factorial of 5 is: {factorial(5)}")
`;

export const codeWriterAgent = new Agent(components.agent, {
    name: "Code Writer Agent",
    chat: model,
    textEmbedding: embeddingModel,
    instructions: codeWriterPrompt,
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

export const generateCodeArtifact = internalAction({
    args: artifactGeneratorArgsValidator,
    handler: async (ctx, args) => {
        const { artifactId, threadId, userId, prompt, latestArtifactContent, backgroundJobStatusId } = args;

        await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
            backgroundJobStatusId,
            status: "running",
            message: "Processing the requirements...",
            progress: 25,
        });

        const { fullStream } = await codeWriterAgent.streamText(ctx, {
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
            }),
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