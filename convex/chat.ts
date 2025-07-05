import { v } from "convex/values";
import { paginationOptsValidator, } from "convex/server";
import { action, httpAction, internalAction, internalMutation, mutation, query } from "./_generated/server";
import { api, components, internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { employeeAgent } from "@/lib/ai/agents/employee-agent";
import { vStreamArgs } from "@convex-dev/agent/validators";
import { anthropicProviderOptions } from "@/lib/ai/model";
import z from "zod";
import dedent from "dedent";
import { createAdvancedTools } from "@/lib/ai/tools/advanced";

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

export const streamMessageAsync = mutation({
    args: {
        prompt: v.string(),
        threadId: v.string(),
        employeeId: v.id("employees"),
        teamId: v.optional(v.id("teams")),
    },
    handler: async (ctx, { prompt, threadId, employeeId, teamId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

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

        await ctx.scheduler.runAfter(0, internal.chat.streamMessage, {
            threadId,
            userId,
            promptMessageId: messageId,
            employeeId,
            teamId,
        });
    },
});

export const streamMessage = internalAction({
    args: {
        threadId: v.string(),
        promptMessageId: v.string(),
        userId: v.id("users"),
        employeeId: v.id("employees"),
        teamId: v.optional(v.id("teams")),
    },
    handler: async (ctx, { promptMessageId, threadId, userId, employeeId, teamId }) => {
        await employeeAgent.generateAndSaveEmbeddings(ctx, {
            messageIds: [promptMessageId],
        });
        const { thread } = await employeeAgent.continueThread(ctx, { threadId, userId });
        const result = await thread.streamText(
            {
                promptMessageId,
                providerOptions: anthropicProviderOptions,
                tools: createAdvancedTools(ctx, threadId, userId, employeeId, teamId),
                maxSteps: 20
            },
            {
                saveStreamDeltas: { chunking: "line", throttleMs: 500 },
            },
        );
        await result.consumeStream();
    },
})

export const continueStreamMessageWithToolResults = internalAction({
    args: {
        threadId: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, { threadId, userId }) => {
        // Fetch currently ongoing tool calls
        const unprocessedBackgroundJobs = await ctx.runQuery(internal.backgroundJobStatuses.getUnprocessedBackgroundJobs, {
            threadId,
        });

        if (unprocessedBackgroundJobs.length === 0) return;

        const { thread } = await employeeAgent.continueThread(ctx, { threadId, userId });
        const { object: backgroundJobStatusIdsToNotify } = await thread.generateObject({
            system: dedent`
                You are the supervisor agent's internal async job queue manager.
                The supervisor fired off requests asynchronously to the executor agents or tools to perform.
                You are called each time a tool call is completed, but we are not sure if we should wait for more tool calls results to be ready or to notify the supervisor of the available ones.
                Essentially, each time you notify the supervisor, you might be interrupting his stream of thought, for example, if 10 tool calls come and you send them each time, the supervisor will be interrupted 10 times and has to replan each time.
                We should bulk tool calls results semantically based on the number of pending tool calls, the supervisor's plan and the current context of the conversation.
                You should only notify of tool calls that are ready to be notified or already failed.

                For example, a quick way to tell if we should wait for more tool calls is to check the messageId in unprocessed tool calls, if many tool calls have the same messageId, we should wait for all of them.
                If a tool call has failed, and a lot of other tool calls are still running, you can notify the supervisor to retry.
                Use your best judgement to determine if we should wait for more tool calls or to notify the supervisor.
            `,
            prompt: dedent`
                Here are the tool calls that are not processed:
                ${JSON.stringify(unprocessedBackgroundJobs.map((toolCall) => {
                return {
                    _id: toolCall._id,
                    messageId: toolCall.messageId,
                    toolName: toolCall.metadata?.toolName,
                    toolParameters: toolCall.metadata?.toolParameters,
                    status: toolCall.status,
                    result: toolCall.result,
                }
            }), null, 2)}

                Return their _ids.
            `,
            schema: z.object({
                toolCallStatusIds: z.array(z.string()),
            }),
        }, {
            storageOptions: {
                saveAnyInputMessages: false,
                saveOutputMessages: false,
            }
        })

        console.log("Kenji", backgroundJobStatusIdsToNotify);
        // Change status to completed
        await ctx.runMutation(internal.backgroundJobStatuses.markBackgroundJobsAsProcessed, {
            backgroundJobStatusIds: backgroundJobStatusIdsToNotify.toolCallStatusIds.map((toolId) => toolId as Id<"backgroundJobStatuses">),
        });

        const { thread: thread2 } = await employeeAgent.continueThread(ctx, { threadId, userId });
        // Add tool results back to the thread
        const result = await thread2.streamText(
            {
                prompt: dedent`
                Here are some tool calls that are ready to be notified:
                ${JSON.stringify(unprocessedBackgroundJobs.filter(toolCall => backgroundJobStatusIdsToNotify.toolCallStatusIds.includes(toolCall._id))
                    .map((toolCall) => {
                        return {
                            _id: toolCall._id,
                            messageId: toolCall.messageId,
                            toolName: toolCall.metadata?.toolName,
                            toolParameters: toolCall.metadata?.toolParameters,
                            status: toolCall.status,
                            result: toolCall.result,
                        }
                    }), null, 2)}
            `, providerOptions: anthropicProviderOptions, maxSteps: 20
            },
            {
                saveStreamDeltas: { chunking: "line", throttleMs: 500 },
                storageOptions: {
                    saveAnyInputMessages: false,
                    saveOutputMessages: true,
                }
            },
        );
        console.log("Kenji got stream", result);
        await result.consumeStream();
    },
})

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