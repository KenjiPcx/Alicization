// import { components, internal } from "@/convex/_generated/api";
// import { Agent } from "@convex-dev/agent";
// import { embeddingModel, imageModel, model } from "@/lib/ai/model";
// import dedent from "dedent";
// import { internalAction } from "@/convex/_generated/server";
// import { experimental_generateImage } from "ai";
// import { z } from "zod";
// import { artifactGeneratorArgsValidator, base64ToBlob } from "./utils";

// export const imageGeneratorAgent = new Agent(components.agent, {
//     name: "Image Generator Agent",
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

// export const generateImageArtifact = internalAction({
//     args: artifactGeneratorArgsValidator,
//     handler: async (ctx, args) => {
//         const { artifactId, threadId, userId, prompt, latestArtifactContent, backgroundJobStatusId } = args;

//         await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
//             backgroundJobStatusId,
//             status: "running",
//             message: "Processing the requirements...",
//             progress: 33,
//         });

//         // First get the parameters for the image generation from the user prompt
//         const { object } = await imageGeneratorAgent.generateObject(ctx, {
//             threadId,
//             userId,
//         }, {
//             schema: z.object({
//                 width: z.number().min(128).max(1024),
//                 height: z.number().min(128).max(1024),
//                 aspectRatio: z.enum(['1:1', '4:3', '16:9', '9:16', '1:2', '2:1', '3:4']),
//             }),
//             prompt: prompt,
//         })

//         const { width, height, aspectRatio } = object;

//         await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
//             backgroundJobStatusId,
//             status: "running",
//             message: "Generating image...",
//             progress: 66,
//         });

//         let draftContent = "";
//         const { image } = await experimental_generateImage({
//             model: imageModel,
//             prompt,
//             n: 1,
//             size: `${width}x${height}`,
//             aspectRatio,
//         });

//         const imageBlob = base64ToBlob(image.base64, 'image/png');
//         const imageId = await ctx.storage.store(imageBlob);
//         const blobDownloadUrl = await ctx.storage.getUrl(imageId);

//         draftContent = JSON.stringify({
//             type: "image",
//             content: image.base64,
//             url: blobDownloadUrl,
//         });

//         return `Generated image: ${blobDownloadUrl}`;
//     },
// });
