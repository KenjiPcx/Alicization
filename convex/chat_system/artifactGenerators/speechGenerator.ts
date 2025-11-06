// import { components, internal } from "@/convex/_generated/api";
// import { Agent } from "@convex-dev/agent";
// import { embeddingModel, model, speechModel } from "@/lib/ai/model";
// import dedent from "dedent";
// import { internalAction } from "@/convex/_generated/server";
// import { experimental_generateSpeech } from "ai";
// import { z } from "zod";
// import { artifactGeneratorArgsValidator, base64ToBlob } from "./utils";

// export const speechGeneratorAgent = new Agent(components.agent, {
//     name: "Speech Generator Agent",
//     chat: model,
//     textEmbedding: embeddingModel,
//     instructions: dedent`
//         You are an expert image generator. You are given a prompt and you need to generate an image based on the prompt.
//     `,
//     contextOptions: {
//         searchOptions: {
//             textSearch: true,
//             vectorSearch: true,
//             limit: 5,
//         }
//     },
//     storageOptions: {
//         saveAnyInputMessages: false,
//         saveOutputMessages: false,
//     }
// });

// export const generateSpeechArtifact = internalAction({
//     args: artifactGeneratorArgsValidator,
//     handler: async (ctx, args) => {
//         const { threadId, userId, prompt, backgroundJobStatusId } = args;

//         await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
//             backgroundJobStatusId,
//             status: "running",
//             message: "Processing the requirements...",
//             progress: 33,
//         });

//         // First get the parameters for the image generation from the user prompt
//         const { object } = await speechGeneratorAgent.generateObject(ctx, {
//             threadId,
//             userId,
//         }, {
//             schema: z.object({
//                 script: z.string().describe("The script to generate a speech for, if the speech is not generated for a text artifact").optional(),
//                 output: z.enum(['mp3', 'wav']).describe("The output format of the speech").default('mp3'),
//                 textArtifactId: z.string().describe("The id of the artifact to generate the speech for, only valid for text artifacts, only use if script is not provided").optional(),
//             }),
//             prompt: prompt,
//         })

//         const { script, output, textArtifactId } = object;

//         let text = ""
//         if (textArtifactId) {
//             const artifact = await ctx.runQuery(internal.artifacts.getLatestArtifactByGroupId, {
//                 artifactGroupId: textArtifactId,
//             });

//             if (!artifact) throw new Error("Artifact not found");
//             if (artifact.kind !== "text") throw new Error("Artifact is not a text artifact");
//             text = artifact.content as string;
//         }

//         if (!script && !text) throw new Error("Script or text artifact id is required");

//         await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
//             backgroundJobStatusId,
//             status: "running",
//             message: "Generating speech...",
//             progress: 66,
//         });

//         let draftContent = "";
//         const { audio } = await experimental_generateSpeech({
//             model: speechModel,
//             text: script || text,
//             outputFormat: output,
//         });

//         const audioBlob = base64ToBlob(audio.base64, `audio/${output}`);
//         const audioId = await ctx.storage.store(audioBlob);
//         const blobDownloadUrl = await ctx.storage.getUrl(audioId);

//         draftContent = JSON.stringify({
//             type: "audio",
//             content: audio.base64,
//             url: blobDownloadUrl,
//         });

//         return `Generated speech: ${blobDownloadUrl}`;
//     },
// });
