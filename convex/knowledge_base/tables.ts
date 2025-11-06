import { v } from "convex/values";
import { defineTable } from "convex/server";

export const knowledgeBaseTables = {
    // Entities that agents can act on
    companyFiles: defineTable({
        artifactGroupId: v.optional(v.string()),
        type: v.union(v.literal("artifact"), v.literal("information")),
        name: v.string(),
        mimeType: v.optional(v.string()),
        size: v.optional(v.number()), // TODO: Remove this field
        aiSummary: v.optional(v.string()),
        companyId: v.id("companies"),
        userId: v.optional(v.string()),
        employeeId: v.optional(v.id("employees")),
        skillId: v.optional(v.id("skills")),
        storageId: v.optional(v.id("_storage")), // TODO: Remove this field
        fileUrl: v.optional(v.string()),
        embeddingStatus: v.union(
            v.literal("pending"),
            v.literal("in-progress"),
            v.literal("completed"),
            v.literal("failed"),
            v.literal("not-applicable"),
        ),
        embeddingProgress: v.optional(v.number()),
        embeddingMessage: v.optional(v.string()),
    })
        .index("by_employeeId", ["employeeId"])
        .index("by_artifactGroupId", ["artifactGroupId"]),

    tags: defineTable({
        name: v.string(),
        embedding: v.array(v.float64()),
    }).vectorIndex("by_embedding", {
        vectorField: "embedding",
        dimensions: 1536,
    }),

    companyFilesToTags: defineTable({
        companyFileId: v.id("companyFiles"),
        tagId: v.id("tags"),
    }).index("by_companyFileId", ["companyFileId"])
        .index("by_tagId", ["tagId"]),

    memories: defineTable({
        key: v.string(),
        value: v.string(),
        scope: v.union(
            v.literal("conversation"), // Tied to a specific chat conversation
            v.literal("personal"), // Private to the creating employee
            v.literal("team"), // Accessible to all team members
            v.literal("user") // Global user preferences
        ),
        threadId: v.string(), // Representing chatId
        employeeId: v.optional(v.id("employees")), // Creator of the memory
        teamId: v.optional(v.id("teams")),
        userId: v.string(),
        embedding: v.array(v.float64()), // For semantic search
    }).index("by_threadId", ["threadId"])
        .index("by_userId", ["userId"])
        .index("by_employeeId", ["employeeId"])
        .index("by_teamId", ["teamId"])
        .vectorIndex("by_embedding", {
            vectorField: "embedding",
            dimensions: 1536,
            filterFields: ["scope", "employeeId", "teamId", "userId", "threadId"],
        }),
}