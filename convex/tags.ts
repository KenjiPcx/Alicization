import { embeddingModel } from "@/lib/ai/model";
import { internalAction, internalMutation, internalQuery, action, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { embed } from "ai";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// Query to fetch tags by IDs (for loading search results)
export const fetchTagsByIds = internalQuery({
    args: {
        ids: v.array(v.id("tags")),
    },
    handler: async (ctx, args) => {
        const results = [];
        for (const id of args.ids) {
            const tag = await ctx.db.get(id);
            if (tag !== null) {
                results.push(tag);
            }
        }
        return results;
    },
});

// Query to get a tag by name (to check if it already exists)
export const getTagByName = internalQuery({
    args: {
        name: v.string(),
    },
    handler: async (ctx, args): Promise<Doc<"tags"> | null> => {
        return await ctx.db
            .query("tags")
            .filter((q) => q.eq(q.field("name"), args.name))
            .first();
    },
});

// Mutation to insert a new tag
export const insertTag = internalMutation({
    args: {
        name: v.string(),
        embedding: v.array(v.float64()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("tags", {
            name: args.name,
            embedding: args.embedding,
        });
    },
});

// Action to perform vector search on tags
export const searchTags = internalAction({
    args: {
        query: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { query, limit = 10 } = args;

        // Generate embedding for the search query
        const { embedding } = await embed({
            model: embeddingModel,
            value: query,
        });

        // Perform vector search
        const results = await ctx.vectorSearch("tags", "by_embedding", {
            vector: embedding,
            limit: Math.min(limit, 256), // Convex limit is 256
        });

        // Fetch the actual tag documents
        const tags: Doc<"tags">[] = await ctx.runQuery(internal.tags.fetchTagsByIds, {
            ids: results.map((result) => result._id),
        });

        // Combine the tags with their similarity scores
        return results.map((result, index) => ({
            ...tags[index],
            _score: result._score,
        }));
    },
});

// Action to create a tag (with deduplication)
export const createTag = internalAction({
    args: {
        name: v.string(),
    },
    handler: async (ctx, args): Promise<Id<"tags">> => {
        const { name } = args;

        // Check if tag already exists
        const existingTag: Doc<"tags"> | null = await ctx.runQuery(internal.tags.getTagByName, { name });
        if (existingTag) {
            return existingTag._id;
        }

        // Generate embedding for the tag name
        const { embedding } = await embed({
            model: embeddingModel,
            value: name,
        });

        // Create the tag using the mutation
        const tagId: Id<"tags"> = await ctx.runMutation(internal.tags.insertTag, {
            name,
            embedding: embedding,
        });

        return tagId;
    },
});

// Public action to search tags (for use in your app)
export const searchTagsPublic = action({
    args: {
        query: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args): Promise<Doc<"tags">[]> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("User not authenticated");

        return await ctx.runAction(internal.tags.searchTags, args);
    },
});

export const getTags = query({
    handler: async (ctx) => {
        return await ctx.db.query("tags").collect();
    },
});
