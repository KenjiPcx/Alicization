// import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
// import { v } from "convex/values";

// // Add a new request to the queue
// export const addToQueue = mutation({
//     args: {
//         threadId: v.string(),
//         title: v.string(),
//         content: v.string(),
//         sender: v.string(),
//     },
//     handler: async (ctx, { threadId, title, content, sender }) => {
//         return await ctx.db.insert("queuedRequests", {
//             threadId,
//             title,
//             content,
//             sender,
//         });
//     },
// });

// // Get all queued requests for a specific thread
// export const getQueuedRequests = query({
//     args: {
//         threadId: v.string(),
//     },
//     handler: async (ctx, { threadId }) => {
//         return await ctx.db
//             .query("queuedRequests")
//             .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
//             .order("asc") // FIFO ordering by createdAt
//             .collect();
//     },
// });

// // Get count of queued requests for a thread
// export const getQueueCount = query({
//     args: {
//         threadId: v.string(),
//     },
//     handler: async (ctx, { threadId }) => {
//         const requests = await ctx.db
//             .query("queuedRequests")
//             .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
//             .collect();
//         return requests.length;
//     },
// });

// // Internal functions for use by other Convex functions

// export const internalPopQueuedRequest = internalMutation({
//     args: {
//         threadId: v.string(),
//     },
//     handler: async (ctx, { threadId }) => {
//         const request = await ctx.db.query("queuedRequests").withIndex("by_threadId", (q) => q.eq("threadId", threadId)).order("asc").first();
//         if (request) {
//             await ctx.db.delete(request._id);
//         }
//         return request;
//     },
// });