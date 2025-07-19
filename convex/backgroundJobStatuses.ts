import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { vBackgroundJobStatuses } from "./schema";

export const getBackgroundJobStatus = query({
    args: v.object({
        toolCallId: v.string(),
    }),
    handler: async (ctx, args) => {
        const { toolCallId } = args;
        const backgroundJobStatus = await ctx.db.query("backgroundJobStatuses")
            .withIndex("by_toolCallId", (q) => q.eq("toolCallId", toolCallId)).first();
        return backgroundJobStatus;
    },
})

export const createBackgroundJobStatus = internalMutation({
    args: v.object({
        toolCallId: v.string(),
        threadId: v.string(),
        toolName: v.string(),
        toolParameters: v.any(),
    }),
    handler: async (ctx, args) => {
        const { toolCallId, threadId, toolName, toolParameters } = args;
        const backgroundJobStatusId = await ctx.db.insert("backgroundJobStatuses", {
            toolCallId,
            threadId,
            metadata: {
                toolName,
                toolParameters,
            },
            statusUpdates: [{
                status: "running",
                timestamp: Date.now(),
                message: "Starting tool call",
                progress: 0,
            }],
            status: "running",
        });
        return backgroundJobStatusId;
    },
})

export const updateBackgroundJobStatus = internalMutation({
    args: v.object({
        backgroundJobStatusId: v.id("backgroundJobStatuses"),
        status: vBackgroundJobStatuses,
        message: v.string(),
        progress: v.number(),
        result: v.optional(v.string()),
    }),
    handler: async (ctx, args) => {
        const { backgroundJobStatusId, status, message, progress, result } = args;

        const backgroundJobStatus = await ctx.db.get(backgroundJobStatusId);
        if (!backgroundJobStatus) throw new Error("Background job status not found");
        const statusUpdates = backgroundJobStatus.statusUpdates;

        const newStatusUpdate = {
            status,
            timestamp: Date.now(),
            message,
            progress,
        }

        await ctx.db.patch(backgroundJobStatusId, {
            statusUpdates: [...statusUpdates, newStatusUpdate],
            status,
            result,
        });
    },
})

// Get all tool calls that are not completed for a given threadId
export const getUnprocessedBackgroundJobs = internalQuery({
    args: v.object({
        threadId: v.string(),
    }),
    handler: async (ctx, args) => {
        const { threadId } = args;
        const ongoingToolCalls = await ctx.db.query("backgroundJobStatuses")
            .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
            .filter((q) => q.and(
                q.neq(q.field("status"), "completed"),
            )).collect();
        return ongoingToolCalls;
    },
})

export const markBackgroundJobsAsProcessed = internalMutation({
    args: v.object({
        backgroundJobStatusIds: v.array(v.id("backgroundJobStatuses")),
    }),
    handler: async (ctx, args) => {
        const { backgroundJobStatusIds } = args;
        backgroundJobStatusIds.forEach(async (backgroundJobStatusId) => {
            await ctx.db.patch(backgroundJobStatusId, {
                status: "completed",
            });
        });
    },
})