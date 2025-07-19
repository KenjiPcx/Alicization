
import { v } from "convex/values";
import { paginationOptsValidator, } from "convex/server";
import { action, httpAction, internalAction, mutation, query } from "./_generated/server";
import { api, components, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { employeeAgent } from "@/lib/ai/agents/employee-agent";
import { vStreamArgs } from "@convex-dev/agent/validators";
import { anthropicProviderOptions } from "@/lib/ai/model";
import dedent from "dedent";
import { cleanupWorkflowHelper } from "./chatWorkflow";
import { workflow } from "./setup";

export const createThread = mutation({
    args: {
        chatOwnerId: v.optional(v.union(v.id("employees"), v.string())), // TODO: Remove string once we have a proper employee type
        chatType: v.union(v.literal("employee"), v.literal("team")),
        visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
    },
    handler: async (ctx, { chatOwnerId, chatType, visibility }): Promise<{ threadId: string }> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const { threadId } = await employeeAgent.createThread(ctx, { userId: userId });

        // Create a new chat
        await ctx.db.insert("chats", {
            userId: userId,
            threadId,
            chatOwnerId,
            chatType,
            visibility: visibility ?? "public",
        });

        return { threadId };
    },
});

export const getLatestThreadByChatOwnerId = action({
    args: { chatOwnerId: v.string() },
    handler: async (ctx, { chatOwnerId }): Promise<{ threadId: string } | null> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Get the most recent chat for this specific chatOwnerId
        const latestChat = await ctx.runQuery(api.chat.getLatestChatByChatOwnerId, {
            chatOwnerId,
        });

        if (latestChat) {
            return { threadId: latestChat.threadId };
        }

        return null;
    },
});

export const kickoffWorkflow = internalAction({
    args: {
        threadId: v.string(),
        userId: v.id("users"),
        employeeId: v.id("employees"),
        teamId: v.id("teams"),
        chatConfig: v.union(v.object({
            type: v.literal("start-chat"),
            promptMessageId: v.string(),
        }), v.object({
            type: v.literal("continue-task"),
            prompt: v.string(),
        })),
    },
    handler: async (ctx, { threadId, userId, employeeId, teamId, chatConfig }) => {
        const workflowId = await workflow.start(ctx,
            internal.chatWorkflow.chatWorkflow,
            {
                chatConfig,
                threadId,
                userId,
                employeeId,
                teamId,
            },
        );

        await cleanupWorkflowHelper(ctx, workflowId);
    },
});

export const streamMessageAsync = mutation({
    args: {
        prompt: v.string(),
        threadId: v.string(),
        employeeId: v.id("employees"),
        teamId: v.id("teams"),
        sender: v.union(v.object({
            type: v.literal("user"),
            userTaskId: v.optional(v.id("userTasks")), // Used for human in the loop
        }), v.object({
            type: v.literal("other-employee"),
            employeeDetails: v.string(),
            userTaskId: v.optional(v.id("userTasks")), // Agents always have a request ref
        })),
    },
    handler: async (ctx, { prompt, threadId, employeeId, teamId, sender }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Check if there's an existing task for this thread
        const existingTask = await ctx.runQuery(internal.tasks.internalGetLatestTask, {
            threadId,
        });

        if (existingTask) {
            if (existingTask.status === "in-progress") {
                // If existing task was not blocked, then we just add the user input as a new todo item
                // Add user input as a new todo to the existing task or to the chat queue
                const todoTitle = dedent`Process ${sender.type === "user" ? "user" : `employee (${sender.employeeDetails})`}
                    ${sender.userTaskId ? `(request ref: ${sender.userTaskId})` : ""}
                    ${sender.type === "user" ? `User input: ${prompt}` : `Employee input: ${prompt}`}
                `;
                await ctx.runMutation(internal.tasks.addTodoToTask, {
                    taskId: existingTask._id,
                    todo: todoTitle,
                });
            }
            
            // If existing task was blocked, then we need to launch a new workflow to ask it to continue processing the input
            // Assume that blocked means that previous workflow already ended, so we start a new one
            if (existingTask.status === "blocked") {
                await ctx.scheduler.runAfter(0, internal.chat.kickoffWorkflow, {
                    threadId,
                    userId,
                    employeeId,
                    teamId,
                    chatConfig: {
                        type: "continue-task",
                        prompt: dedent`
                            Response for user task: ${sender.userTaskId} ${sender.type === "user" ? "user" : `employee (${sender.employeeDetails})`}
                            ${prompt}
                        `,
                    },
                });
            }

            // If this is a response to a human collaboration request, mark it as responded
            if (sender.userTaskId) {
                await ctx.runMutation(internal.userTasks.updateUserTaskStatus, {
                    userTaskId: sender.userTaskId,
                    status: "responded",
                    response: prompt,
                });
            }

            // Otherwise, the previous workflow should still be running, so it can just pick this up the next time it calls one of the todo tools, it will just appear in the todo list and the agent can continue working on it
            return { message: "Added to existing task, existing task run will process the input" };
        }

        else {
            // Save the message and use the saved message ID
            const { messageId } = await employeeAgent.saveMessage(ctx, {
                threadId,
                prompt,
                skipEmbeddings: true,
            });

            await ctx.scheduler.runAfter(
                1000,
                internal.threadTitles.maybeUpdateThreadTitle,
                { threadId }
            );

            // Call workflow here
            await ctx.scheduler.runAfter(0, internal.chat.kickoffWorkflow, {
                threadId,
                userId,
                employeeId,
                teamId,
                chatConfig: {
                    type: "start-chat",
                    promptMessageId: messageId,
                },
            });
        }
    },
});

export const sendMessageHttpStream = httpAction(async (ctx, request) => {
    const {
        message,
        id: threadId,
        selectedChatModel,
        employeeId,
        selectedChatVisibility
    } = await request.json();

    console.log({ message, threadId, selectedChatModel, employeeId, selectedChatVisibility });

    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // TODO: Add tools to plan and schedule a handoff
    const { thread } = await employeeAgent.continueThread(ctx, {
        threadId,
        userId,
    });

    const result = await thread.streamText({ messages: [message], providerOptions: anthropicProviderOptions });
    await ctx.scheduler.runAfter(
        1000,
        internal.threadTitles.maybeUpdateThreadTitle,
        { threadId }
    );

    const response = result.toDataStreamResponse();
    response.headers.set("Message-Id", result.messageId);
    return response;
});

export const deleteChatsByThreadId = mutation({
    args: { threadId: v.string() },
    handler: async (ctx, { threadId }) => {
        const chats = await ctx.db.query("chats").withIndex("by_threadId", (q) => q.eq("threadId", threadId)).collect();
        for (const chat of chats) {
            await ctx.db.delete(chat._id);
        }
    },
});

export const deleteThread = action({
    args: { threadId: v.string() },
    handler: async (ctx, { threadId }) => {
        // Delete the chat metadata 
        await ctx.runMutation(api.chat.deleteChatsByThreadId, { threadId });

        // Delete the thread and all its messages
        await ctx.runAction(components.agent.threads.deleteAllForThreadIdSync, { threadId });
        return { success: true };
    },
});

/**
 * Query & subscribe to messages & threads
 */

export const listThreadMessages = query({
    args: {
        // These arguments are required:
        threadId: v.string(),
        paginationOpts: paginationOptsValidator, // Used to paginate the messages.
        streamArgs: vStreamArgs, // Used to stream messages.
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const { threadId, paginationOpts, streamArgs } = args;
        const streams = await employeeAgent.syncStreams(ctx, { threadId, streamArgs });
        // Here you could filter out / modify the stream of deltas / filter out
        // deltas.

        const paginated = await employeeAgent.listMessages(ctx, {
            threadId,
            paginationOpts,
        });
        // Here you could filter out metadata that you don't want from any optional
        // fields on the messages.
        // You can also join data onto the messages. They need only extend the
        // MessageDoc type.
        // { ...messages, page: messages.page.map(...)}

        return {
            ...paginated,
            streams,
            // ... you can return other metadata here too.
            // note: this function will be called with various permutations of delta
            // and message args, so returning derived data .
        };
    },
});


export const getMessages = query({
    args: { threadId: v.string(), paginationOpts: paginationOptsValidator },
    handler: async (ctx, { threadId, paginationOpts }) => {

        const messages = await ctx.runQuery(components.agent.messages.listMessagesByThreadId, {
            threadId,
            paginationOpts,
            excludeToolMessages: false,
            order: "asc",
        });
        return messages;

    },
});

export const getInProgressMessages = query({
    args: { threadId: v.string() },
    handler: async (ctx, { threadId }) => {
        const { page } = await ctx.runQuery(
            components.agent.messages.listMessagesByThreadId,
            {
                threadId, statuses: ["pending"],
                order: "asc",
            },
        );
        return page;
    },
});

export const getChatByThreadId = query({
    args: { threadId: v.string() },
    handler: async (ctx, { threadId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const chat = await ctx.db
            .query("chats")
            .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
            .filter((q) => q.eq(q.field("userId"), userId))
            .first();

        return chat;
    },
});

export const getLatestChatByChatOwnerId = query({
    args: { chatOwnerId: v.string() },
    handler: async (ctx, { chatOwnerId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const latestChat = await ctx.db
            .query("chats")
            .withIndex("by_userId_chatOwnerId", (q) =>
                q.eq("userId", userId).eq("chatOwnerId", chatOwnerId)
            )
            .order("desc")
            .first();

        return latestChat;
    },
});

export const getChatHistory = query({
    args: {
        chatOwnerId: v.union(v.id("employees"), v.id("users"), v.string()), // TODO: Remove string once we have a proper employee type
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, { chatOwnerId, paginationOpts }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Get paginated chats for the user
        const chatsResult = await ctx.db
            .query("chats")
            .withIndex("by_userId_chatOwnerId", (q) => q.eq("userId", userId).eq("chatOwnerId", chatOwnerId))
            .order("desc")
            .paginate(paginationOpts);

        // Enrich chats with thread data
        const enrichedChats = await Promise.all(
            chatsResult.page.map(async (chat) => {
                const thread = await ctx.runQuery(components.agent.threads.getThread, {
                    threadId: chat.threadId,
                });

                return {
                    ...chat,
                    thread,
                };
            })
        );

        return {
            ...chatsResult,
            page: enrichedChats,
        };
    },
});

export const updateChatVisibilityByThreadId = mutation({
    args: {
        threadId: v.string(),
        visibility: v.union(v.literal("public"), v.literal("private")),
    },
    handler: async (ctx, { threadId, visibility }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const chat = await ctx.db
            .query("chats")
            .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
            .filter((q) => q.eq(q.field("userId"), userId))
            .first();

        if (!chat) throw new Error("Chat not found");

        await ctx.db.patch(chat._id, { visibility });
    },
});