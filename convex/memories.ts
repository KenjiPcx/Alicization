import { internalMutation, internalQuery, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { embed } from "ai";
import { embeddingModel } from "@/lib/ai/model";
import { Doc, Id } from "./_generated/dataModel";

/**
 * For lazy embeddings
 */
export const updateMemoryEmbeddings = internalMutation({
    args: v.object({
        memoryId: v.id("memories"),
        embedding: v.array(v.float64()),
    }),
    handler: async (ctx, args) => {
        const { memoryId, embedding } = args;

        await ctx.db.patch(memoryId, {
            embedding: embedding,
        });
    },
})

/**
 * For lazy embeddings
 */
export const embedMemory = internalAction({
    args: v.object({
        memoryId: v.id("memories"),
        value: v.string(),
    }),
    handler: async (ctx, args) => {
        const { memoryId, value } = args;

        const { embedding } = await embed({
            model: embeddingModel,
            value: value,
        })

        await ctx.runMutation(internal.memories.updateMemoryEmbeddings, {
            memoryId,
            embedding,
        });
    },
});

/**
 * Universal memory setter (uses injected context)
 */
export const setMemory = internalMutation({
    args: v.object({
        key: v.string(),
        value: v.string(),
        scope: v.union(
            v.literal("personal"),
            v.literal("team"),
            v.literal("conversation"),
            v.literal("user")
        ),
        threadId: v.string(),
        employeeId: v.optional(v.id("employees")),
        teamId: v.optional(v.id("teams")),
        userId: v.id("users"),
    }),
    handler: async (ctx, args) => {
        const { key, value, scope, threadId, userId, employeeId, teamId } = args;

        // For now, create a simple embedding (zeros) - we'll improve this later
        const embedding = new Array(1536).fill(0);

        // Check if memory already exists with same key and scope
        const existingMemory = await ctx.db
            .query("memories")
            .filter(q => q.and(
                q.eq(q.field("key"), key),
                q.eq(q.field("scope"), scope),
                // Additional filters based on scope
                scope === "personal" && employeeId ? q.eq(q.field("employeeId"), employeeId) : true,
                scope === "team" && teamId ? q.eq(q.field("teamId"), teamId) : true,
                scope === "user" ? q.eq(q.field("userId"), userId) : true,
                scope === "conversation" && threadId ? q.eq(q.field("threadId"), threadId) : true
            ))
            .first();

        if (existingMemory) {
            // Update existing memory
            await ctx.db.patch(existingMemory._id, {
                value,
                threadId,
                embedding,
            });
            return existingMemory._id;
        } else {
            // Create new memory
            const memoryId = await ctx.db.insert("memories", {
                key,
                value,
                scope,
                threadId,
                userId,
                employeeId,
                teamId,
                embedding,
            });
            return memoryId;
        }
    },
});

/**
 * Helper query to fetch memories by IDs
 */
export const fetchMemoriesByIds = internalQuery({
    args: v.object({
        ids: v.array(v.id("memories")),
    }),
    handler: async (ctx, args): Promise<Doc<"memories">[]> => {
        const results = [];
        for (const id of args.ids) {
            const memory = await ctx.db.get(id);
            if (memory !== null) {
                results.push(memory);
            }
        }
        return results;
    },
});

/**
 * Universal memory search (uses injected context with vector search)
 */
export const searchMemories = internalAction({
    args: v.object({
        query: v.string(),
        threadId: v.string(),
        userId: v.id("users"),
        scope: v.optional(v.union(
            v.literal("personal"),
            v.literal("team"),
            v.literal("conversation"),
            v.literal("user")
        )),
        employeeId: v.optional(v.id("employees")),
        teamId: v.optional(v.id("teams")),
        limit: v.number(),
    }),
    handler: async (ctx, args) => {
        const { query, threadId, userId, scope, limit, employeeId, teamId } = args;

        // Generate embedding for semantic search
        const { embedding } = await embed({
            model: embeddingModel,
            value: query,
        });

        // Perform vector search with OR filter to get more candidates
        const results = await ctx.vectorSearch("memories", "by_embedding", {
            vector: embedding,
            limit: limit * 2, // Get more results for access control filtering
            filter: (q) => {
                if (scope) {
                    // If scope is specified, filter by that scope only
                    return q.eq("scope", scope);
                } else {
                    // If no scope specified, get candidates from all accessible scopes
                    const scopeFilters = [
                        q.eq("scope", "user"), // Always accessible
                    ];

                    if (employeeId) {
                        scopeFilters.push(q.eq("scope", "personal"));
                    }

                    if (teamId) {
                        scopeFilters.push(q.eq("scope", "team"));
                    }

                    if (threadId) {
                        scopeFilters.push(q.eq("scope", "conversation"));
                    }

                    return q.or(...scopeFilters);
                }
            },
        });

        // Fetch the actual memory documents
        const memoryIds = results.map(r => r._id);
        const memories: Doc<"memories">[] = await ctx.runQuery(internal.memories.fetchMemoriesByIds, {
            ids: memoryIds,
        });

        // Combine results with scores (no access control needed)
        const memoriesWithScores = results.map(result => {
            const memory = memories.find(m => m._id === result._id);
            if (!memory) return null;

            return {
                key: memory.key,
                value: memory.value,
                scope: memory.scope,
                threadId: memory.threadId,
                employeeId: memory.employeeId,
                teamId: memory.teamId,
                _score: result._score,
            };
        }).filter(Boolean);

        return memoriesWithScores.slice(0, limit);
    },
});