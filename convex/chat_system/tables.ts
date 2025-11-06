import { v } from "convex/values";
import { defineTable } from "convex/server";

export const vAttachment = v.object({
    url: v.string(),
    name: v.optional(v.string()),
    contentType: v.optional(v.string()),
})

export const vArtifactKinds = v.union(
    v.literal("text"),
    v.literal("code"),
    v.literal("sheet"),
    v.literal("image"),
    v.literal("video"),
    v.literal("music"),
)

export const chatTables = {
    // Store extra metadata for a chat beyond the thread managed by the agent package
    chats: defineTable({
        userId: v.string(), // User can see all their AI owned chats
        chatOwnerId: v.optional(v.union(v.id("employees"), v.string(), v.string())), // Owner of the chat, if user talks to an employee, user will be the owner, if an employee talks to another employee, the employee will be the owner
        chatOwnerType: v.optional(v.union(
            v.literal("employee"),
            v.literal("user"),
        )),
        threadId: v.string(),
        updateTitlesScheduledFunctionId: v.optional(v.id("_scheduled_functions")),
        visibility: v.optional(v.union(
            v.literal("public"),
            v.literal("private"),
        )),

        // Chat type and metadata
        chatType: v.optional(v.union(
            v.literal("employee"), // 1:1 chat with single employee
            v.literal("team"), // Chat with entire team
            v.literal("group") // Custom group chat with selected employees
        )),
        name: v.optional(v.string()), // Custom name for group chats

        attachments: v.optional(v.array(vAttachment)),
    }).index("by_threadId", ["threadId"])
        .index("by_userId_chatOwnerId", ["userId", "chatOwnerId"]),

    // Junction table for chat participants (employees in the chat)
    chatParticipants: defineTable({
        chatId: v.id("chats"),
        employeeId: v.id("employees"),
        joinedAt: v.number(),
        role: v.union(v.literal("participant"), v.literal("admin")),
    }).index("by_chatId", ["chatId"])
        .index("by_employeeId", ["employeeId"])
        .index("by_chatId_employeeId", ["chatId", "employeeId"]),

    artifacts: defineTable({
        artifactGroupId: v.string(),
        version: v.number(),
        title: v.string(),
        description: v.optional(v.string()),
        content: v.optional(v.string()),
        kind: vArtifactKinds,
        employeeId: v.string(),
        toolCallId: v.string(),
    }).index("by_artifactGroupId", ["artifactGroupId"])
        .index("by_employeeId", ["employeeId"])
        .index("by_toolCallId", ["toolCallId"]),

    suggestions: defineTable({
        artifactId: v.id("artifacts"),
        originalText: v.string(),
        suggestedText: v.string(),
        description: v.optional(v.string()),
        isResolved: v.boolean(),
        userId: v.string(),
        createdAt: v.number(),
    })
        .index("by_artifactId", ["artifactId"])
        .index("by_userId", ["userId"]),

    // Feedback and learning
    votes: defineTable({
        messageId: v.string(),
        isUpvoted: v.boolean(),
        threadId: v.string(),
        comment: v.optional(v.string()),
    }).index("by_messageId", ["messageId"])
        .index("by_threadId", ["threadId"]),

    queuedRequests: defineTable({
        threadId: v.string(),
        title: v.string(),
        content: v.string(),
        sender: v.string(), // user name or employee name
    }).index("by_threadId", ["threadId"]),

    // Each complex task in a thread are represented as a task
    // Each thread could have multiple complex tasks
    tasks: defineTable({
        threadId: v.string(),
        title: v.string(),
        description: v.string(),
        plan: v.array(v.string()),
        todos: v.array(v.object({
            title: v.string(),
            status: v.union(v.literal("pending"), v.literal("in-progress"), v.literal("completed")),
        })),
        status: v.optional(v.union(v.literal("in-progress"), v.literal("completed"), v.literal("blocked"))),
        done: v.optional(v.boolean()),
        watchdogScheduledFunctionId: v.optional(v.id("_scheduled_functions")),
        context: v.optional(v.object({
            userId: v.string(),
            employeeId: v.id("employees"),
            teamId: v.id("teams"),
        })),
    }).index("by_threadId", ["threadId"]),
}