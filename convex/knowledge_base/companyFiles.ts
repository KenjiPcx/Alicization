// import { v } from "convex/values";
// import { internalAction, internalMutation, internalQuery, mutation, query } from "../convex/_generated/server";
// import { getAuthUserId } from "@convex-dev/auth/server";
// import { internal } from "../convex/_generated/api";
// import type { DataModel, Id } from "../convex/_generated/dataModel";
// import { patchCompanyFile } from "../convex/utils";
// import { rag } from "../convex/setup";

// export const createCompanyFile = internalMutation({
//     args: {
//         artifactGroupId: v.optional(v.string()),
//         type: v.union(v.literal("artifact"), v.literal("information")),
//         name: v.string(),
//         mimeType: v.string(),
//         size: v.optional(v.number()),
//         companyId: v.id("companies"),
//         userId: v.optional(v.id("users")),
//         employeeId: v.optional(v.id("employees")),
//         skillId: v.optional(v.id("skills")),
//         storageId: v.optional(v.id("_storage")),
//         fileUrl: v.optional(v.string()),
//     },
//     handler: async (ctx, args) => {
//         const companyFileId = await ctx.db.insert("companyFiles", {
//             ...args,
//             embeddingStatus: "pending",
//             embeddingProgress: 0,
//             embeddingMessage: "Scheduling embedding job",
//         });

//         return companyFileId;
//     },
// })

// export const updateCompanyFile = internalMutation({
//     args: {
//         companyFileId: v.id("companyFiles"),
//         name: v.optional(v.string()),
//         mimeType: v.optional(v.string()),
//         size: v.optional(v.number()),
//         storageId: v.id("_storage"),
//     },
//     handler: async (ctx, args) => {
//         await patchCompanyFile(ctx, args.companyFileId, args);
//     },
// })

// export const getCompanyFiles = query({
//     args: {
//         employeeId: v.optional(v.id("employees")),
//     },
//     handler: async (ctx, args) => {
//         const userId = await getAuthUserId(ctx);

//         if (!userId) {
//             throw new Error("User not authenticated");
//         }

//         const companyFiles = await ctx.db.query("companyFiles")
//             .filter((q) => {
//                 const baseFilter = q.eq("userId", userId as string);
//                 if (args.employeeId) {
//                     return q.and(baseFilter, q.eq("employeeId", args.employeeId as string));
//                 }
//                 return baseFilter;
//             })
//             .collect();
//         return companyFiles;
//     },
// });

// export const insertCompanyFileToTag = internalMutation({
//     args: {
//         companyFileId: v.id("companyFiles"),
//         tagId: v.id("tags"),
//     },
//     handler: async (ctx, args) => {
//         const { companyFileId, tagId } = args;
//         await ctx.db.insert("companyFilesToTags", { companyFileId, tagId });
//     },
// })

// export const updateCompanyFileSummary = internalMutation({
//     args: {
//         companyFileId: v.id("companyFiles"),
//         aiSummary: v.string(),
//     },
//     handler: async (ctx, args) => {
//         const { companyFileId, aiSummary } = args;
//         await ctx.db.patch(companyFileId, { aiSummary });
//     },
// })

// export const fillCompanyFileSummaryAndTags = internalAction({
//     args: {
//         companyFileId: v.id("companyFiles"),
//         summary: v.string(),
//         tags: v.array(v.string()),
//     },
//     handler: async (ctx, args) => {
//         const { companyFileId, summary, tags } = args;

//         // Create the tags if they don't exist
//         const tagIds = await Promise.all(tags.map(tag => ctx.runAction(internal.tags.createTag, { name: tag })));

//         // Create the company file to tags
//         await Promise.all(tagIds.map(tagId => ctx.runMutation(internal.companyFiles.insertCompanyFileToTag, { companyFileId, tagId })));

//         // Update the company file with the summary and tags
//         await ctx.runMutation(internal.companyFiles.updateCompanyFileSummary, {
//             companyFileId,
//             aiSummary: summary,
//         });
//     },
// })

// export const getCompanyFileByArtifactGroupId = internalQuery({
//     args: {
//         artifactGroupId: v.string(),
//     },
//     handler: async (ctx, args) => {
//         const { artifactGroupId } = args;
//         return await ctx.db.query("companyFiles")
//             .withIndex("by_artifactGroupId", (q) => q.eq("artifactGroupId", artifactGroupId))
//             .first();
//     },
// })

// export const convertArtifactToCompanyFile = internalAction({
//     args: {
//         artifactGroupId: v.string(),
//         companyId: v.id("companies"),
//         employeeId: v.id("employees"),
//         userId: v.optional(v.id("users")),
//         skillId: v.optional(v.id("skills")),
//     },
//     handler: async (ctx, args) => {
//         const { artifactGroupId, companyId, userId, skillId, employeeId } = args;
//         const artifact = await ctx.runQuery(internal.artifacts.getLatestArtifactByGroupId, {
//             artifactGroupId,
//         });

//         if (!artifact || !artifact.content) throw new Error("Artifact not found");

//         const markdownBlob = new Blob([artifact.content], { type: "text/markdown" });
//         const storageId = await ctx.storage.store(markdownBlob);

//         const companyFileId = await ctx.runMutation(internal.companyFiles.createCompanyFile, {
//             artifactGroupId,
//             type: "artifact",
//             companyId,
//             name: artifact.title,
//             mimeType: "text/markdown",
//             size: artifact.content.length,
//             storageId,
//             userId,
//             skillId,
//             employeeId,
//         });

//         // Can do it like this since the file is quite small, just one page
//         await rag.add(ctx, {
//             namespace: companyId, // All files belong to the company
//             key: companyFileId,
//             title: artifact.title,
//             text: artifact.content,
//             filterValues: [
//                 { name: "category", value: "artifact" },
//                 { name: "contentType", value: "text/markdown" },
//                 { name: "teamId", value: companyId },
//                 { name: "employeeId", value: employeeId },
//             ],
//             onComplete: internal.companyFiles.ingestionComplete,
//         })
//     },
// })

// export const ingestionComplete = rag.defineOnComplete<DataModel>(
//     async (ctx, { replacedEntry, entry, error }) => {
//         if (error) {
//             await rag.delete(ctx, { entryId: entry.entryId });
//             return;
//         }
//         if (replacedEntry) {
//             await rag.delete(ctx, { entryId: replacedEntry.entryId });
//         }

//         await ctx.runMutation(internal.companyFiles.updateCompanyFileEmbeddingStatus, {
//             companyFileId: entry.key as Id<"companyFiles">,
//             embeddingStatus: "completed",
//             embeddingProgress: 100,
//             embeddingMessage: "Ingestion complete",
//         });
//     }
// );

// export const deleteCompanyFile = mutation({
//     args: {
//         companyFileId: v.id("companyFiles"),
//     },
//     handler: async (ctx, args) => {
//         const { companyFileId } = args;
//         const companyFile = await ctx.db.get(companyFileId);
//         if (!companyFile) {
//             throw new Error("Company file not found");
//         }

//         // Delete the chunks through RAG component
//         await rag.add(ctx, {
//             key: companyFileId,
//             namespace: companyFile.companyId,
//             text: "",
//             onComplete: internal.companyFiles.ingestionComplete,
//         })

//         // Delete the company file
//         await ctx.db.delete(companyFileId);
//     },
// })

// export const updateCompanyFileEmbeddingStatus = internalMutation({
//     args: {
//         companyFileId: v.id("companyFiles"),
//         embeddingStatus: v.union(v.literal("pending"), v.literal("in-progress"), v.literal("completed"), v.literal("failed"), v.literal("not-applicable")),
//         embeddingProgress: v.optional(v.number()),
//         embeddingMessage: v.optional(v.string()),
//     },
//     handler: async (ctx, args) => {
//         const { companyFileId, embeddingStatus, embeddingProgress, embeddingMessage } = args;
//         await ctx.db.patch(companyFileId, {
//             embeddingStatus,
//             embeddingProgress,
//             embeddingMessage,
//         });
//     },
// })

// export const getCompanyFileContent = query({
//     args: {
//         companyFileId: v.id("companyFiles"),
//     },
//     handler: async (ctx, args) => {
//         const userId = await getAuthUserId(ctx);

//         if (!userId) {
//             throw new Error("User not authenticated");
//         }

//         const companyFile = await ctx.db.get(args.companyFileId);
//         if (!companyFile) {
//             throw new Error("Company file not found");
//         }

//         // Get the file URL from storage
//         const fileUrl = companyFile.fileUrl ? companyFile.fileUrl : companyFile.storageId ? await ctx.storage.getUrl(companyFile.storageId) : undefined;
//         if (!fileUrl) {
//             throw new Error("File content not found");
//         }

//         return {
//             ...companyFile,
//             fileUrl,
//         };
//     },
// });

// export const getEmployeeDrive = query({
//     args: {
//         employeeId: v.id("employees"),
//         skillId: v.optional(v.id("skills")),
//     },
//     handler: async (ctx, args) => {
//         const userId = await getAuthUserId(ctx);

//         if (!userId) {
//             throw new Error("User not authenticated");
//         }

//         if (!args.employeeId) {
//             return [];
//         }

//         // Get all skills for this employee
//         const employeeSkills = await ctx.db.query("employeeToSkills")
//             .withIndex("by_employeeId", (q) => q.eq("employeeId", args.employeeId))
//             .collect();

//         const skillIds = employeeSkills.map(es => es.skillId);

//         // Build comprehensive query for ALL company files accessible to this employee
//         let allFiles = [];

//         // 1. Files directly assigned to employee
//         const directFiles = await ctx.db.query("companyFiles")
//             .withIndex("by_employeeId", (q) => q.eq("employeeId", args.employeeId))
//             .collect();

//         console.log("directFiles", directFiles);

//         allFiles.push(...directFiles);

//         // 2. Files linked to employee's skills
//         if (skillIds.length > 0) {
//             for (const skillId of skillIds) {
//                 const skillFiles = await ctx.db.query("companyFiles")
//                     .filter((q) => q.eq(q.field("skillId"), skillId))
//                     .collect();
//                 allFiles.push(...skillFiles);
//             }
//         }

//         console.log("allFiles", allFiles);

//         // Remove duplicates by file ID
//         const uniqueFiles = allFiles.filter((file, index, self) =>
//             index === self.findIndex(f => f._id === file._id)
//         );

//         // If skillId filter is provided, filter by that specific skill
//         const filteredFiles = args.skillId
//             ? uniqueFiles.filter(file => file.skillId === args.skillId)
//             : uniqueFiles;

//         // Get skill information for each file
//         const filesWithSkills = await Promise.all(
//             filteredFiles.map(async (file) => {
//                 if (file.skillId) {
//                     const skill = await ctx.db.get(file.skillId);
//                     return {
//                         ...file,
//                         skill,
//                     };
//                 }
//                 return {
//                     ...file,
//                     skill: null,
//                 };
//             })
//         );

//         return filesWithSkills.sort((a, b) => b._creationTime - a._creationTime);
//     },
// });