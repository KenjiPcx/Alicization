import { v } from "convex/values";
import { httpAction, internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { embed } from "ai";
import { embeddingModel } from "@/lib/ai/model";
import type { Doc } from "./_generated/dataModel";

export const createCompanyFile = internalMutation({
    args: {
        name: v.string(),
        mimeType: v.string(),
        size: v.number(),
        userId: v.id("users"),
        employeeId: v.optional(v.id("employees")),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const { name, mimeType, userId, storageId, employeeId, size } = args;

        const needToEmbed = mimeType.startsWith('text/') || mimeType.startsWith('application/pdf');
        const companyFileId = await ctx.db.insert("companyFiles", {
            name,
            mimeType,
            userId,
            size,
            storageId,
            employeeId,
            embeddingStatus: needToEmbed ? "pending" : "not-applicable",
            embeddingProgress: needToEmbed ? 0 : undefined,
            embeddingMessage: needToEmbed ? "Scheduling embedding job" : undefined,
        });

        // if (needToEmbed) {
        //     ctx.scheduler.runAfter(0, internal.ai.rag.ingestFile.ingestFile, {
        //         storageId,
        //         companyFileId,
        //         fileName: name,
        //         mimeType,
        //     });
        // }

        return companyFileId;
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

export const uploadCompanyFile = httpAction(async (ctx, request) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
        throw new Error("User not authenticated");
    }

    // Step 1: Parse as FormData to preserve filename
    const formData = await request.formData();
    const file = formData.get("file") as File; // assuming the field name is "file"

    if (!file) {
        return new Response("No file uploaded", { status: 400 });
    }

    // Step 2: Store the file
    const storageId = await ctx.storage.store(file);

    // Step 3: Save the storage ID to the database via a mutation
    const companyFileId = await ctx.runMutation(
        internal.companyFiles.createCompanyFile,
        {
            storageId,
            userId,
            name: file.name,
            mimeType: file.type,
            size: file.size,
            employeeId: undefined,
        }
    );

    return new Response(JSON.stringify({ companyFileId }), {
        status: 200,
        // CORS headers
        headers: new Headers({
            // e.g. https://mywebsite.com, configured on your Convex dashboard
            "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN as string,
            Vary: "origin",
        }),
    });
})

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