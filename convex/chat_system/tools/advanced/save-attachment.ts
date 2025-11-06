// import { internal } from "@/convex/_generated/api";
// import { z } from "zod";
// import { ResolveToolProps, withToolErrorHandling } from "../../../lib/ai/tool-utils";
// import { tool } from "ai";
// import dedent from "dedent";

// export const useSaveAttachmentPrompt = dedent`
// <Save Attachment Tool
//     You can use this tool to save a file attachment as a company file, essentially exposing it to the retrieval augmented generation system so you can use this data in your future responses through a search engine, only save documents and not images
// </Save Attachment Tool>
// `

// type SaveAttachmentResult = {
//     success: boolean;
//     message: string;
//     companyFileId?: string;
//     backgroundJobStatusId?: string;
//     fileName?: string;
// };

// export const resolveSaveAttachmentTool = ({
//     ctx,
//     threadId,
//     userId,
//     teamId,
//     employeeId,
//     companyId,
// }: ResolveToolProps) => tool({
//     description: "Save an attachment as a company file, essentially exposing it to the retrieval augmented generation system, only save documents and not images",
//     parameters: z.object({
//         url: z.string().describe("The url of the attachment"),
//         name: z.string().describe("The name of the attachment"),
//         contentType: z.string().describe("The content type of the attachment"),
//         category: z.optional(z.string().describe("Optional category for the file (e.g., 'policy', 'manual', 'specification')")),
//     }),
//     execute: async (args, { toolCallId }): Promise<SaveAttachmentResult> => {
//         return withToolErrorHandling(
//             async () => {
//                 const { url, name, contentType, category = "document" } = args;

//                 // Validate that it's not an image
//                 if (contentType.startsWith('image/')) {
//                     throw new Error("Cannot save images as company files. Only documents are supported.");
//                 }

//                 const companyFileId = await ctx.runMutation(internal.companyFiles.createCompanyFile, {
//                     name,
//                     mimeType: contentType,
//                     companyId,
//                     userId,
//                     type: "information",
//                     fileUrl: url,
//                 });

//                 const backgroundJobStatusId = await ctx.runMutation(internal.backgroundJobStatuses.createBackgroundJobStatus, {
//                     threadId,
//                     toolCallId,
//                     toolName: "save-attachment",
//                     toolParameters: args,
//                 });

//                 await ctx.scheduler.runAfter(0, internal.companyFileNode.ingestFile, {
//                     url,
//                     name,
//                     contentType,
//                     companyFileId,
//                     companyId,
//                     category,
//                     backgroundJobStatusId,
//                     teamId,
//                     employeeId,
//                 });

//                 return {
//                     success: true,
//                     companyFileId,
//                     backgroundJobStatusId,
//                     fileName: name,
//                 };
//             },
//             {
//                 operation: "Attachment saving and ingestion",
//                 includeTechnicalDetails: true
//             },
//             (result) => ({
//                 message: `Successfully saved "${result.fileName}" as a company file and added it to the knowledge base.`,
//                 ...result,
//             })
//         );
//     },
// })