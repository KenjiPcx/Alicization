import { v } from "convex/values";
import { defineTable } from "convex/server";

export const userSystemTables = {
    // Store extra metadata for a user beyond the user managed by the auth package
    usersMetadata: defineTable({
        userId: v.string(),
        type: v.union(v.literal("regular"), v.literal("pro")),
        onboardingCompleted: v.optional(v.boolean()),
        onboardingCompletedAt: v.optional(v.number()),
    }).index("by_userId", ["userId"]),

    // Human collaboration requests
    userTasks: defineTable({
        threadId: v.string(),
        employeeId: v.id("employees"),
        userId: v.string(),
        message: v.string(),
        type: v.union(v.literal("approval"), v.literal("review"), v.literal("question"), v.literal("permission")),
        context: v.string(),
        status: v.union(v.literal("pending"), v.literal("responded"), v.literal("cancelled")),
        response: v.optional(v.string()),
        respondedAt: v.optional(v.number()),
        createdAt: v.number(),
    }).index("by_threadId", ["threadId"])
        .index("by_status", ["status"])
        .index("by_userId", ["userId"]),
}