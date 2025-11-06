import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getAuthUserId } from "@/convex/utils";

export const getVotesByThreadId = query({
    args: { threadId: v.string() },
    handler: async (ctx, { threadId }) => {
        const votes = await ctx.db.query("votes")
            .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
            .collect();
        return votes;
    },
});

export const addVote = mutation({
    args: {
        threadId: v.string(),
        messageId: v.string(),
        isUpvoted: v.boolean(),
        comment: v.optional(v.string())
    },
    handler: async (ctx, { threadId, messageId, isUpvoted, comment }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("User not authenticated");
        }

        const voteDoc = await ctx.db.insert("votes",
            {
                threadId,
                messageId,
                isUpvoted,
                comment,
            });

        return voteDoc;
    },
});