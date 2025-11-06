// import { components, internal } from "@/convex/_generated/api";
// import { Agent } from "@convex-dev/agent";
// import { embeddingModel, model } from "@/lib/ai/model";
// import dedent from "dedent";
// import { internalAction } from "@/convex/_generated/server";
// import { smoothStream, streamText } from "ai";
// import { artifactGeneratorArgsValidator } from "./utils";

// const writerPrompt = dedent`
//     You are an expert writer. Write about the given topic. Markdown is supported. Use headings wherever appropriate.
// `

// export const writerAgent = new Agent(components.agent, {
//     name: "Writer Agent",
//     chat: model,
//     textEmbedding: embeddingModel,
//     instructions: writerPrompt,
//     contextOptions: {
//         searchOptions: {
//             // textSearch: true,
//             // vectorSearch: true,
//             limit: 5,
//         }
//     },
//     storageOptions: {
//         saveAnyInputMessages: false,
//         saveOutputMessages: false,
//     }
// });

// export const generateTextArtifact = internalAction({
//     args: artifactGeneratorArgsValidator,
//     handler: async (ctx, args) => {
//         const { artifactId, threadId, userId, prompt, latestArtifactContent, backgroundJobStatusId } = args;

//         await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
//             backgroundJobStatusId,
//             status: "running",
//             message: "Processing the requirements...",
//             progress: 25,
//         });

//         // Use AI SDK directly with conditional parameters
//         const { fullStream } = latestArtifactContent
//             ? streamText({
//                 model,
//                 system: writerPrompt,
//                 messages: [
//                     {
//                         role: "user",
//                         content: `Here is the current artifact:\n\n${latestArtifactContent}`
//                     },
//                     {
//                         role: "user",
//                         content: `Please update the artifact with the following feedback:\n\n${prompt}`
//                     }
//                 ],
//                 experimental_transform: smoothStream({
//                     delayInMs: 500,
//                     chunking: "line",
//                 })
//             })
//             : await writerAgent.streamText(ctx, {
//                 threadId,
//                 userId,
//             }, {
//                 model,
//                 system: writerPrompt,
//                 prompt,
//                 experimental_transform: smoothStream({
//                     delayInMs: 500,
//                     chunking: "line",
//                 })
//             })

//         let draftContent = "";
//         let encounteredTextDelta = false;
//         let batchCounter = 0;
//         let batchedChunk = "";

//         console.log("Generating text artifact")
//         // Wait for the stream to finish
//         // These mutations will persist the changes to the artifact in the database
//         for await (const chunk of fullStream) {
//             if (chunk.type === "error") {
//                 console.error("Error generating text artifact", chunk.error);
//                 await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
//                     backgroundJobStatusId,
//                     status: "failed",
//                     message: `Error generating artifact: ${chunk.error}`,
//                     progress: 100,
//                 });
//                 throw new Error(`Error generating text artifact: ${chunk.error}`);
//             }

//             if (chunk.type === "text-delta") {
//                 // Same with the text delta phase
//                 if (!encounteredTextDelta) {
//                     await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
//                         backgroundJobStatusId,
//                         status: "running",
//                         message: "Writing the artifact...",
//                         progress: 75,
//                     });
//                     encounteredTextDelta = true;
//                 }

//                 // Batch the chunks to avoid too many mutations
//                 batchCounter++;
//                 batchedChunk += chunk.textDelta;
//                 if (batchCounter % 5 === 0) {
//                     await ctx.runMutation(internal.artifacts.handleArtifactTextChunk, {
//                         artifactId,
//                         content: batchedChunk,
//                     });
//                     batchedChunk = "";
//                 }

//                 draftContent += chunk.textDelta;
//             }
//         }

//         // CRITICAL FIX: Send any remaining batched content
//         if (batchedChunk.length > 0) {
//             await ctx.runMutation(internal.artifacts.handleArtifactTextChunk, {
//                 artifactId,
//                 content: batchedChunk,
//             });
//         }

//         // Check if we actually generated content
//         if (draftContent.trim().length === 0) {
//             await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
//                 backgroundJobStatusId,
//                 status: "failed",
//                 message: "No content was generated. Please try again with a different prompt.",
//                 progress: 100,
//             });
//             throw new Error("No content was generated");
//         }

//         // Update status to completed
//         await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
//             backgroundJobStatusId,
//             status: "completed",
//             message: "Artifact generated successfully!",
//             progress: 100,
//         });

//         console.log("Generated text artifact");

//         return draftContent;
//     },
// });
