import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { embed } from "ai";
import { embeddingModel } from "@/lib/ai/model";
import type { DataModel, Doc, Id } from "./_generated/dataModel";
import { patchCompanyFile } from "./utils";
import { rag } from "./setup";

export const createCompanyFile = internalMutation({
    args: {
        artifactGroupId: v.optional(v.string()),
        type: v.union(v.literal("artifact"), v.literal("information")),
        name: v.string(),
        mimeType: v.string(),
        size: v.number(),
        companyId: v.id("companies"),
        userId: v.optional(v.id("users")),
        employeeId: v.optional(v.id("employees")),
        skillId: v.optional(v.id("skills")),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const companyFileId = await ctx.db.insert("companyFiles", {
            ...args,
            embeddingStatus: "pending",
            embeddingProgress: 0,
            embeddingMessage: "Scheduling embedding job",
        });

        return companyFileId;
    },
})

export const updateCompanyFile = internalMutation({
    args: {
        companyFileId: v.id("companyFiles"),
        name: v.optional(v.string()),
        mimeType: v.optional(v.string()),
        size: v.optional(v.number()),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        await patchCompanyFile(ctx, args.companyFileId, args);
    },
})

export const getCompanyFiles = query({
    args: {
        employeeId: v.optional(v.id("employees")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if (!userId) {
            throw new Error("User not authenticated");
        }

        const companyFiles = await ctx.db.query("companyFiles")
            .filter((q) => {
                const baseFilter = q.eq("userId", userId as string);
                if (args.employeeId) {
                    return q.and(baseFilter, q.eq("employeeId", args.employeeId as string));
                }
                return baseFilter;
            })
            .collect();
        return companyFiles;
    },
});

export const insertCompanyFileToTag = internalMutation({
    args: {
        companyFileId: v.id("companyFiles"),
        tagId: v.id("tags"),
    },
    handler: async (ctx, args) => {
        const { companyFileId, tagId } = args;
        await ctx.db.insert("companyFilesToTags", { companyFileId, tagId });
    },
})

export const updateCompanyFileSummary = internalMutation({
    args: {
        companyFileId: v.id("companyFiles"),
        aiSummary: v.string(),
    },
    handler: async (ctx, args) => {
        const { companyFileId, aiSummary } = args;
        await ctx.db.patch(companyFileId, { aiSummary });
    },
})

export const fillCompanyFileSummaryAndTags = internalAction({
    args: {
        companyFileId: v.id("companyFiles"),
        summary: v.string(),
        tags: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const { companyFileId, summary, tags } = args;

        // Create the tags if they don't exist
        const tagIds = await Promise.all(tags.map(tag => ctx.runAction(internal.tags.createTag, { name: tag })));

        // Create the company file to tags
        await Promise.all(tagIds.map(tagId => ctx.runMutation(internal.companyFiles.insertCompanyFileToTag, { companyFileId, tagId })));

        // Update the company file with the summary and tags
        await ctx.runMutation(internal.companyFiles.updateCompanyFileSummary, {
            companyFileId,
            aiSummary: summary,
        });
    },
})

export const getCompanyFileByArtifactGroupId = internalQuery({
    args: {
        artifactGroupId: v.string(),
    },
    handler: async (ctx, args) => {
        const { artifactGroupId } = args;
        return await ctx.db.query("companyFiles")
            .withIndex("by_artifactGroupId", (q) => q.eq("artifactGroupId", artifactGroupId))
            .first();
    },
})

export const convertArtifactToCompanyFile = internalAction({
    args: {
        artifactGroupId: v.string(),
        companyId: v.id("companies"),
        userId: v.optional(v.id("users")),
        skillId: v.optional(v.id("skills")),
    },
    handler: async (ctx, args) => {
        const { artifactGroupId, companyId, userId, skillId } = args;
        const artifact = await ctx.runQuery(internal.artifacts.getLatestArtifactByGroupId, {
            artifactGroupId,
        });

        if (!artifact || !artifact.content) throw new Error("Artifact not found");

        const markdownBlob = new Blob([artifact.content], { type: "text/markdown" });
        const storageId = await ctx.storage.store(markdownBlob);

        const companyFileId = await ctx.runMutation(internal.companyFiles.createCompanyFile, {
            artifactGroupId,
            type: "artifact",
            companyId,
            name: artifact.title,
            mimeType: "text/markdown",
            size: artifact.content.length,
            storageId,
            userId,
            skillId,
        });

        // Can do it like this since the file is quite small, just one page
        await rag.add(ctx, {
            namespace: companyId, // All files belong to the company
            key: companyFileId,
            title: artifact.title,
            text: artifact.content,
            onComplete: internal.companyFiles.ingestionComplete,
        })
    },
})

export const ingestionComplete = rag.defineOnComplete<DataModel>(
    async (ctx, { replacedEntry, entry, error }) => {
        if (error) {
            await rag.delete(ctx, { entryId: entry.entryId });
            return;
        }
        if (replacedEntry) {
            await rag.delete(ctx, { entryId: replacedEntry.entryId });
        }

        await ctx.runMutation(internal.companyFiles.updateCompanyFileEmbeddingStatus, {
            companyFileId: entry.key as Id<"companyFiles">,
            embeddingStatus: "completed",
            embeddingProgress: 100,
            embeddingMessage: "Ingestion complete",
        });
    }
);

export const deleteCompanyFile = mutation({
    args: {
        companyFileId: v.id("companyFiles"),
    },
    handler: async (ctx, args) => {
        const { companyFileId } = args;
        const companyFile = await ctx.db.get(companyFileId);
        if (!companyFile) {
            throw new Error("Company file not found");
        }

        // Delete the chunks
        const chunks = await ctx.db.query("companyFileEmbeddingChunks")
            .withIndex("by_companyFileId", (q) => q.eq("companyFileId", companyFileId))
            .collect();
        chunks.forEach(async chunk => await ctx.db.delete(chunk._id));

        // Delete the company file
        await ctx.db.delete(companyFileId);

        // Delete the file from storage
        await ctx.storage.delete(companyFile.storageId);
    },
})

// Embedding chunks
export const insertCompanyFileEmbeddingChunk = internalMutation({
    args: {
        companyFileId: v.id("companyFiles"),
        metadata: v.string(),
        text: v.string(),
        page: v.optional(v.number()),
        embedding: v.array(v.float64()),
    },
    handler: async (ctx, args) => {
        const { companyFileId, metadata, text, page, embedding } = args;
        await ctx.db.insert("companyFileEmbeddingChunks", {
            companyFileId,
            metadata,
            text,
            page,
            embedding,
        });
    },
})

export const getCompanyFileEmbeddingChunks = internalQuery({
    args: {
        ids: v.array(v.id("companyFileEmbeddingChunks")),
    },
    handler: async (ctx, args) => {
        const results = [];
        for (const id of args.ids) {
            const doc = await ctx.db.get(id);
            if (doc === null) {
                continue;
            }
            results.push(doc);
        }
        return results;
    },
})

export const updateCompanyFileEmbeddingStatus = internalMutation({
    args: {
        companyFileId: v.id("companyFiles"),
        embeddingStatus: v.union(v.literal("pending"), v.literal("in-progress"), v.literal("completed"), v.literal("failed"), v.literal("not-applicable")),
        embeddingProgress: v.optional(v.number()),
        embeddingMessage: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { companyFileId, embeddingStatus, embeddingProgress, embeddingMessage } = args;
        await ctx.db.patch(companyFileId, {
            embeddingStatus,
            embeddingProgress,
            embeddingMessage,
        });
    },
})

export const searchCompanyFileEmbeddingChunks = internalAction({
    args: {
        query: v.string(),
    },
    handler: async (ctx, args) => {
        const { query } = args;

        const { embedding } = await embed({
            value: query,
            model: embeddingModel,
        });

        const results = await ctx.vectorSearch("companyFileEmbeddingChunks", "by_embedding", {
            vector: embedding,
            limit: 10,
        });

        const chunks: Array<Doc<"companyFileEmbeddingChunks">> = await ctx.runQuery(
            internal.companyFiles.getCompanyFileEmbeddingChunks, {
            ids: results.map(result => result._id),
        });

        // Merge score into the chunks
        const chunksWithScore = chunks.map((chunk, index) => ({
            ...chunk,
            score: results[index]._score,
        }));

        return chunksWithScore;
    },
})

export const getCompanyFileContent = query({
    args: {
        companyFileId: v.id("companyFiles"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if (!userId) {
            throw new Error("User not authenticated");
        }

        const companyFile = await ctx.db.get(args.companyFileId);
        if (!companyFile) {
            throw new Error("Company file not found");
        }

        // Get the file URL from storage
        const fileUrl = await ctx.storage.getUrl(companyFile.storageId);
        if (!fileUrl) {
            throw new Error("File content not found");
        }

        return {
            ...companyFile,
            fileUrl,
        };
    },
});

export const getEmployeeDrive = query({
    args: {
        employeeId: v.id("employees"),
        skillId: v.optional(v.id("skills")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);

        if (!userId) {
            throw new Error("User not authenticated");
        }

        if (!args.employeeId) {
            return [];
        }

        // Get all skills for this employee
        const employeeSkills = await ctx.db.query("employeeToSkills")
            .withIndex("by_employeeId", (q) => q.eq("employeeId", args.employeeId))
            .collect();

        const skillIds = employeeSkills.map(es => es.skillId);

        // Build comprehensive query for ALL company files accessible to this employee
        let allFiles = [];

        // 1. Files directly assigned to employee
        const directFiles = await ctx.db.query("companyFiles")
            .withIndex("by_employeeId", (q) => q.eq("employeeId", args.employeeId))
            .filter((q) => q.eq("userId", userId as string))
            .collect();

        allFiles.push(...directFiles);

        // 2. Files linked to employee's skills
        if (skillIds.length > 0) {
            for (const skillId of skillIds) {
                const skillFiles = await ctx.db.query("companyFiles")
                    .filter((q) => q.and(
                        q.eq(q.field("skillId"), skillId),
                        q.eq("userId", userId as string)
                    ))
                    .collect();
                allFiles.push(...skillFiles);
            }
        }

        // Remove duplicates by file ID
        const uniqueFiles = allFiles.filter((file, index, self) =>
            index === self.findIndex(f => f._id === file._id)
        );

        // If skillId filter is provided, filter by that specific skill
        const filteredFiles = args.skillId
            ? uniqueFiles.filter(file => file.skillId === args.skillId)
            : uniqueFiles;

        // Get skill information for each file
        const filesWithSkills = await Promise.all(
            filteredFiles.map(async (file) => {
                if (file.skillId) {
                    const skill = await ctx.db.get(file.skillId);
                    return {
                        ...file,
                        skill,
                    };
                }
                return {
                    ...file,
                    skill: null,
                };
            })
        );

        return filesWithSkills.sort((a, b) => b._creationTime - a._creationTime);
    },
});