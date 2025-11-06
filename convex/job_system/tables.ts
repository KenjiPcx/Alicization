import { v } from "convex/values";
import { defineTable } from "convex/server";

export const vBackgroundJobStatuses = v.union(
    v.literal("pending"),
    v.literal("running"),
    v.literal("notify-supervisor"),
    v.literal("completed"),
    v.literal("failed"),
)

export const jobSystemTables = {
    scheduledJobs: defineTable({
        name: v.string(),
        cron: v.string(),
        taskName: v.string(),
        triggerMessage: v.string(),
        type: v.union(
            v.literal("this-thread"),
            v.literal("new-thread")
        ),
        threadId: v.optional(v.string()),
        employeeId: v.id("employees"),
        teamId: v.optional(v.id("teams")),
        status: v.union(v.literal("pending"), v.literal("running"), v.literal("completed"), v.literal("failed")),
        result: v.optional(v.string()),
        error: v.optional(v.string()),
    }),

    // For streaming tool updates
    backgroundJobStatuses: defineTable({
        toolCallId: v.string(),
        threadId: v.string(),
        metadata: v.optional(v.object({
            toolName: v.string(),
            toolParameters: v.any(),
        })),
        statusUpdates: v.array(v.object({
            status: vBackgroundJobStatuses,
            timestamp: v.number(),
            message: v.optional(v.string()),
            progress: v.number(),
        })),
        status: vBackgroundJobStatuses,
        result: v.optional(v.string()),
    }).index("by_toolCallId", ["toolCallId"])
        .index("by_threadId", ["threadId"]),
}