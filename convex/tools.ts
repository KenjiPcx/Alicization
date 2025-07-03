import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

export const createTool = internalMutation({
    args: {
        name: v.string(),
        description: v.string(),
        type: v.union(
            v.literal("mcp"),
            v.literal("api"),
            v.literal("prebuilt")
        ),
        config: v.any(),
    },
    handler: async (ctx, args): Promise<Id<"tools">> => {
        const { name, description, type, config } = args;

        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const toolId = await ctx.db.insert("tools", {
            name,
            description,
            type,
            config,
            userId,
        });

        return toolId;
    },
})

export const getToolsByUserId = internalQuery({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const { userId } = args;

        const tools = await ctx.db.query("tools").withIndex("by_userId", (q) => q.eq("userId", userId)).collect();

        return tools;
    },
})

