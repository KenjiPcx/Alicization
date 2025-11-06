
// import { v } from "convex/values";
// import { paginationOptsValidator, } from "convex/server";
// import { action, httpAction, internalAction, internalMutation, internalQuery, mutation, query } from "../convex/_generated/server";
// import { api, components, internal } from "../convex/_generated/api";
// import { getAuthUserId } from "@convex-dev/auth/server";
// import { employeeAgent } from "@/archive/employee-agent";
// import { vStreamArgs } from "@convex-dev/agent/validators";
// import { anthropicProviderOptions } from "@/lib/ai/model";
// import dedent from "dedent";
// import { cleanupWorkflowHelper } from "./workflow/chat";
// import { workflow } from "../convex/setup";
// import { type Attachment } from "@/lib/types";
// import { vAttachment } from "./lib/validators";
// import { vWorkflowId } from "@convex-dev/workflow";
// import { vResultValidator } from "@convex-dev/workpool";

// export const createThread = mutation({
//     args: {
//         chatOwnerId: v.optional(v.union(v.id("employees"), v.string())), // TODO: Remove string once we have a proper employee type
//         chatType: v.union(v.literal("employee"), v.literal("team")),
//         visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
//     },
//     handler: async (ctx, { chatOwnerId, chatType, visibility }): Promise<{ threadId: string }> => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) throw new Error("Not authenticated");

//         const { threadId } = await employeeAgent.createThread(ctx, { userId: userId });

//         // Create a new chat
//         await ctx.db.insert("chats", {
//             userId: userId,
//             threadId,
//             chatOwnerId,
//             chatType,
//             visibility: visibility ?? "public",
//         });

//         return { threadId };
//     },
// });

// export const getLatestThreadByChatOwnerId = action({
//     args: { chatOwnerId: v.string() },
//     handler: async (ctx, { chatOwnerId }): Promise<{ threadId: string } | null> => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) throw new Error("Not authenticated");

//         // Get the most recent chat for this specific chatOwnerId
//         const latestChat = await ctx.runQuery(api.chat.getLatestChatByChatOwnerId, {
//             chatOwnerId,
//         });

//         if (latestChat) {
//             return { threadId: latestChat.threadId };
//         }

//         return null;
//     },
// });

// export const kickoffWorkflow = internalAction({
//     args: {
//         threadId: v.string(),
//         userId: v.id("users"),
//         employeeId: v.id("employees"),
//         teamId: v.id("teams"),
//         chatConfig: v.union(v.object({
//             type: v.literal("start-chat"),
//             promptMessageId: v.string(),
//         }), v.object({
//             type: v.literal("continue-task"),
//             prompt: v.string(),
//         })),
//         attachments: v.optional(v.array(vAttachment)),
//     },
//     handler: async (ctx, { threadId, userId, employeeId, teamId, chatConfig, attachments }) => {
//         await workflow.start(ctx,
//             internal.workflow.chat.chatWorkflow,
//             {
//                 chatConfig,
//                 threadId,
//                 userId,
//                 employeeId,
//                 teamId,
//                 attachments,
//             },
//             {
//                 onComplete: internal.chat.onCompleteChatWorkflow,
//                 context: {
//                     threadId,
//                     userId,
//                     employeeId,
//                     teamId,
//                 }
//             }
//         );
//     },
// });

// export const onCompleteChatWorkflow = internalMutation({
//     args: {
//         workflowId: vWorkflowId,
//         result: vResultValidator,
//         context: v.object({
//             threadId: v.string(),
//             userId: v.id("users"),
//             employeeId: v.id("employees"),
//             teamId: v.id("teams"),
//         })
//     },
//     handler: async (ctx, { workflowId, result, context }) => {
//         console.log("Chat workflow completed", result);
//         await cleanupWorkflowHelper(ctx, workflowId);

//         const { threadId, userId, employeeId, teamId } = context;

//         if (!threadId) {
//             console.error("Chat workflow completed but no threadId provided");
//             return;
//         }

//         // Check for queued requests, if they exist, kick off a new workflow to process them
//         const queuedRequest = await ctx.runMutation(internal.queuedRequests.internalPopQueuedRequest, {
//             threadId,
//         });

//         if (!queuedRequest) {
//             console.log("No queued request found");
//             return;
//         }

//         // // Kick off workflow to process the queued request
//         // await ctx.scheduler.runAfter(0, internal.chat.kickoffWorkflow, {
//         //     threadId,
//         //     userId,
//         //     employeeId,
//         //     teamId,
//         //     chatConfig: {
//         //         // type: queuedRequest.type,
//         //         prompt: queuedRequest.content,
//         //     },
//         // });
//     },
// });

// export const streamMessageAsync = mutation({
//     args: {
//         prompt: v.string(),
//         threadId: v.string(),
//         employeeId: v.id("employees"),
//         teamId: v.id("teams"),
//         sender: v.union(v.object({
//             type: v.literal("user"),
//             userTaskId: v.optional(v.id("userTasks")), // Used for human in the loop
//         }), v.object({
//             type: v.literal("other-employee"),
//             employeeDetails: v.string(),
//             userTaskId: v.optional(v.id("userTasks")), // Agents always have a request ref
//         })),
//         attachments: v.optional(v.array(vAttachment)),
//     },
//     handler: async (ctx, { prompt, threadId, employeeId, teamId, sender, attachments }) => {
//         // const userId = await getAuthUserId(ctx);
//         // if (!userId) throw new Error("Not authenticated");

//         // // Check if there's an existing task for this thread
//         // const existingTask = await ctx.runQuery(internal.tasks.internalGetLatestTask, {
//         //     threadId,
//         // });

//         // // Save attachments to the hidden chat context
//         // if (attachments && attachments.length > 0) {
//         //     await ctx.runMutation(internal.chat.saveAttachmentsToChat, {
//         //         threadId,
//         //         attachments,
//         //     });
//         // }

//         // if (existingTask) {
//         //     if (existingTask.status === "in-progress") {
//         //         // If existing task was not blocked, then we just add the user input as a new todo item
//         //         // Add user input as a new todo to the existing task or to the chat queue
//         //         const todoTitle = dedent`Process ${sender.type === "user" ? "user" : `employee (${sender.employeeDetails})`}
//         //             ${sender.userTaskId ? `(request ref: ${sender.userTaskId})` : ""}
//         //             ${sender.type === "user" ? `User input: ${prompt}` : `Employee input: ${prompt}`}
//         //         `;
//         //         await ctx.runMutation(internal.tasks.addTodoToTask, {
//         //             taskId: existingTask._id,
//         //             todo: todoTitle,
//         //         });
//         //     }

//         //     // If existing task was blocked, then we need to launch a new workflow to ask it to continue processing the input
//         //     // Assume that blocked means that previous workflow already ended, so we start a new one
//         //     if (existingTask.status === "blocked") {
//         //         await ctx.scheduler.runAfter(0, internal.chat.kickoffWorkflow, {
//         //             threadId,
//         //             userId,
//         //             employeeId,
//         //             teamId,
//         //             chatConfig: {
//         //                 type: "continue-task",
//         //                 prompt: dedent`
//         //                     Response for user task: ${sender.userTaskId} ${sender.type === "user" ? "user" : `employee (${sender.employeeDetails})`}
//         //                     ${prompt}
//         //                 `,
//         //             },
//         //             attachments,
//         //         });
//         //     }

//         //     // If this is a response to a human collaboration request, mark it as responded
//         //     if (sender.userTaskId) {
//         //         await ctx.runMutation(internal.userTasks.updateUserTaskStatus, {
//         //             userTaskId: sender.userTaskId,
//         //             status: "responded",
//         //             response: prompt,
//         //         });
//         //     }

//         //     // Otherwise, the previous workflow should still be running, so it can just pick this up the next time it calls one of the todo tools, it will just appear in the todo list and the agent can continue working on it
//         //     return { message: "Added to existing task, existing task run will process the input" };
//         // }

//         // else {
//         //     const content = convertAttachmentsToContent(attachments?.map((attachment) => ({
//         //         name: attachment.name ?? "",
//         //         url: attachment.url,
//         //         contentType: attachment.contentType ?? "",
//         //     })), prompt)

//         //     // Save the message and use the saved message ID
//         //     const { messageId } = await employeeAgent.saveMessage(ctx, {
//         //         threadId,
//         //         message: {
//         //             role: "user",
//         //             content,
//         //         },
//         //         skipEmbeddings: true,
//         //     });

//         //     await ctx.scheduler.runAfter(
//         //         1000,
//         //         internal.threadTitles.maybeUpdateThreadTitle,
//         //         { threadId }
//         //     );

//         //     // Call workflow here
//         //     await ctx.scheduler.runAfter(0, internal.chat.kickoffWorkflow, {
//         //         threadId,
//         //         userId,
//         //         employeeId,
//         //         teamId,
//         //         chatConfig: {
//         //             type: "start-chat",
//         //             promptMessageId: messageId,
//         //         },
//         //         attachments,
//         //     });
//         // }
//     },
// });

// export const deleteChatsByThreadId = mutation({
//     args: { threadId: v.string() },
//     handler: async (ctx, { threadId }) => {
//         const chats = await ctx.db.query("chats").withIndex("by_threadId", (q) => q.eq("threadId", threadId)).collect();
//         for (const chat of chats) {
//             await ctx.db.delete(chat._id);
//         }
//     },
// });

// export const deleteThread = action({
//     args: { threadId: v.string() },
//     handler: async (ctx, { threadId }) => {
//         // Delete the chat metadata 
//         await ctx.runMutation(api.chat.deleteChatsByThreadId, { threadId });

//         // Delete the thread and all its messages
//         await ctx.runAction(components.agent.threads.deleteAllForThreadIdSync, { threadId });
//         return { success: true };
//     },
// });

// /**
//  * Query & subscribe to messages & threads
//  */

// export const listThreadMessages = query({
//     args: {
//         // These arguments are required:
//         threadId: v.string(),
//         paginationOpts: paginationOptsValidator, // Used to paginate the messages.
//         streamArgs: vStreamArgs, // Used to stream messages.
//     },
//     handler: async (ctx, args) => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) throw new Error("Not authenticated");

//         const { threadId, paginationOpts, streamArgs } = args;
//         const streams = await employeeAgent.syncStreams(ctx, { threadId, streamArgs });
//         // Here you could filter out / modify the stream of deltas / filter out
//         // deltas.

//         const paginated = await employeeAgent.listMessages(ctx, {
//             threadId,
//             paginationOpts,
//         });
//         // Here you could filter out metadata that you don't want from any optional
//         // fields on the messages.
//         // You can also join data onto the messages. They need only extend the
//         // MessageDoc type.
//         // { ...messages, page: messages.page.map(...)}

//         return {
//             ...paginated,
//             streams,
//             // ... you can return other metadata here too.
//             // note: this function will be called with various permutations of delta
//             // and message args, so returning derived data .
//         };
//     },
// });


// export const getMessages = query({
//     args: { threadId: v.string(), paginationOpts: paginationOptsValidator },
//     handler: async (ctx, { threadId, paginationOpts }) => {

//         const messages = await ctx.runQuery(components.agent.messages.listMessagesByThreadId, {
//             threadId,
//             paginationOpts,
//             excludeToolMessages: false,
//             order: "asc",
//         });
//         return messages;

//     },
// });

// export const getInProgressMessages = query({
//     args: { threadId: v.string() },
//     handler: async (ctx, { threadId }) => {
//         const { page } = await ctx.runQuery(
//             components.agent.messages.listMessagesByThreadId,
//             {
//                 threadId, statuses: ["pending"],
//                 order: "asc",
//             },
//         );
//         return page;
//     },
// });

// export const getChatByThreadId = query({
//     args: { threadId: v.string() },
//     handler: async (ctx, { threadId }) => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) throw new Error("Not authenticated");

//         const chat = await ctx.db
//             .query("chats")
//             .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
//             .filter((q) => q.eq(q.field("userId"), userId))
//             .first();

//         return chat;
//     },
// });

// export const getLatestChatByChatOwnerId = query({
//     args: { chatOwnerId: v.string() },
//     handler: async (ctx, { chatOwnerId }) => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) throw new Error("Not authenticated");

//         const latestChat = await ctx.db
//             .query("chats")
//             .withIndex("by_userId_chatOwnerId", (q) =>
//                 q.eq("userId", userId).eq("chatOwnerId", chatOwnerId)
//             )
//             .order("desc")
//             .first();

//         return latestChat;
//     },
// });

// export const getChatHistory = query({
//     args: {
//         chatOwnerId: v.union(v.id("employees"), v.id("users"), v.string()), // TODO: Remove string once we have a proper employee type
//         paginationOpts: paginationOptsValidator,
//     },
//     handler: async (ctx, { chatOwnerId, paginationOpts }) => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) throw new Error("Not authenticated");

//         // Get paginated chats for the user
//         const chatsResult = await ctx.db
//             .query("chats")
//             .withIndex("by_userId_chatOwnerId", (q) => q.eq("userId", userId).eq("chatOwnerId", chatOwnerId))
//             .order("desc")
//             .paginate(paginationOpts);

//         // Enrich chats with thread data
//         const enrichedChats = await Promise.all(
//             chatsResult.page.map(async (chat) => {
//                 const thread = await ctx.runQuery(components.agent.threads.getThread, {
//                     threadId: chat.threadId,
//                 });

//                 return {
//                     ...chat,
//                     thread,
//                 };
//             })
//         );

//         return {
//             ...chatsResult,
//             page: enrichedChats,
//         };
//     },
// });

// export const updateChatVisibilityByThreadId = mutation({
//     args: {
//         threadId: v.string(),
//         visibility: v.union(v.literal("public"), v.literal("private")),
//     },
//     handler: async (ctx, { threadId, visibility }) => {
//         const userId = await getAuthUserId(ctx);
//         if (!userId) throw new Error("Not authenticated");

//         const chat = await ctx.db
//             .query("chats")
//             .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
//             .filter((q) => q.eq(q.field("userId"), userId))
//             .first();

//         if (!chat) throw new Error("Chat not found");

//         await ctx.db.patch(chat._id, { visibility });
//     },
// });

// export const getHiddenChatState = internalQuery({
//     args: {
//         threadId: v.string(),
//     },
//     handler: async (ctx, { threadId }) => {
//         const chat = await ctx.db.query("chats").withIndex("by_threadId", (q) => q.eq("threadId", threadId)).first();
//         if (!chat) throw new Error("Chat not found");

//         return {
//             attachments: chat.attachments,
//         };
//     },
// });

// export const internalGetChatByThreadId = internalQuery({
//     args: {
//         threadId: v.string(),
//     },
//     handler: async (ctx, { threadId }) => {
//         return await ctx.db
//             .query("chats")
//             .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
//             .first();
//     },
// });

// export const saveAttachmentsToChat = internalMutation({
//     args: {
//         threadId: v.string(),
//         attachments: v.array(vAttachment),
//     },
//     handler: async (ctx, { threadId, attachments }) => {
//         const chat = await ctx.db.query("chats").withIndex("by_threadId", (q) => q.eq("threadId", threadId)).first();
//         if (!chat) throw new Error("Chat not found");

//         const newAttachments = [...(chat.attachments || []), ...attachments];
//         await ctx.db.patch(chat._id, { attachments: newAttachments });
//     },
// });

// // Utility function to convert attachments schema to content format
// export const convertAttachmentsToContent = (
//     attachments: Attachment[] | undefined,
//     prompt: string | undefined
// ): Array<
//     | { type: "text"; text: string }
//     | { type: "image"; image: string; mimeType?: string }
//     | { type: "file"; data: string; filename?: string; mimeType: string }
// > => {
//     const content: Array<
//         | { type: "text"; text: string }
//         | { type: "image"; image: string; mimeType?: string }
//         | { type: "file"; data: string; filename?: string; mimeType: string }
//     > = [];

//     // Add attachments first
//     if (attachments && attachments.length > 0) {
//         for (const attachment of attachments) {
//             // Check if it's an image based on contentType
//             if (attachment.contentType?.startsWith('image/')) {
//                 content.push({
//                     type: "image",
//                     image: attachment.url,
//                     mimeType: attachment.contentType,
//                 });
//             } else if (attachment.contentType) {
//                 // For non-image files, add them as file attachments
//                 content.push({
//                     type: "file",
//                     data: attachment.url,
//                     filename: attachment.name,
//                     mimeType: attachment.contentType,
//                 });
//             }
//             // For attachments without contentType, skip or add as text reference
//         }
//     }

//     // Add the text prompt
//     if (prompt) {
//         content.push({
//             type: "text",
//             text: prompt,
//         });
//     }

//     return content;
// }