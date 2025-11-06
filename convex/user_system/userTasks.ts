import { v } from "convex/values";
import { internalMutation, query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export const createUserTask = internalMutation({
    args: v.object({
        threadId: v.string(),
        employeeId: v.id("employees"),
        userId: v.id("users"),
        message: v.string(),
        type: v.union(v.literal("approval"), v.literal("review"), v.literal("question"), v.literal("permission")),
        context: v.string(),
        status: v.union(v.literal("pending"), v.literal("responded"), v.literal("cancelled")),
    }),
    handler: async (ctx, args) => {
        const humanRequestId = await ctx.db.insert("userTasks", {
            ...args,
            createdAt: Date.now(),
        });

        return await ctx.db.get(humanRequestId);
    },
});

export const updateUserTaskStatus = internalMutation({
    args: v.object({
        userTaskId: v.id("userTasks"),
        status: v.union(v.literal("pending"), v.literal("responded"), v.literal("cancelled")),
        response: v.optional(v.string()),
    }),
    handler: async (ctx, args) => {
        const { userTaskId, status, response } = args;

        const updateData: any = { status };
        if (response) {
            updateData.response = response;
            updateData.respondedAt = Date.now();
        }

        await ctx.db.patch(userTaskId, updateData);
        return await ctx.db.get(userTaskId);
    },
});

export const getUserTask = query({
    args: v.object({
        userTaskId: v.id("userTasks"),
    }),
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userTaskId);
    },
});

export const getPendingUserTasks = query({
    args: v.object({
        threadId: v.string(),
    }),
    handler: async (ctx, args) => {
        return await ctx.db
            .query("userTasks")
            .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();
    },
});

export const getAllPendingUserTasks = query({
    args: v.object({
        userId: v.id("users"),
    }),
    handler: async (ctx, args) => {
        return await ctx.db
            .query("userTasks")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();
    },
}); 