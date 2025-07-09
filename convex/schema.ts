import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { vProviderMetadata, vUsage } from "@convex-dev/agent";

export const vArtifactKinds = v.union(
  v.literal("text"),
  v.literal("code"),
  v.literal("sheet"),
  v.literal("image"),
  v.literal("video"),
  v.literal("music"),
)

export const vBackgroundJobStatuses = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("notify-supervisor"),
  v.literal("completed"),
  v.literal("failed"),
)

export const vEmployeeStatuses = v.union(
  v.literal("info"),
  v.literal("success"),
  v.literal("question"),
  v.literal("warning"),
  v.literal("none"),
)

export const vKpiStatuses = v.union(
  v.literal("pending"),
  v.literal("in-progress"),
  v.literal("completed"),
  v.literal("failed"),
)

export const vKpiDirections = v.union(
  v.literal("increase"),
  v.literal("decrease"),
)

export const vKpiScopes = v.union(
  v.literal("company"),
  v.literal("team"),
  v.literal("employee"),
)

export const vKpiQuarters = v.union(
  v.literal("Q1"),
  v.literal("Q2"),
  v.literal("Q3"),
  v.literal("Q4"),
)

export const vKpi = v.object({
  name: v.string(),
  description: v.string(),
  direction: vKpiDirections,
  unit: v.string(),
  currentValue: v.optional(v.number()),
  target: v.optional(v.number()),
  companyId: v.optional(v.id("company")),
  teamId: v.optional(v.id("teams")),
  employeeId: v.optional(v.id("employees")),
  scope: vKpiScopes,
  status: vKpiStatuses,
  quarter: vKpiQuarters,
  year: v.number(),
  statusMessage: v.optional(v.string()),
})

export const applicationTables = {
  // Store extra metadata for a user beyond the user managed by the auth package
  usersMetadata: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("regular"), v.literal("pro")),
  }).index("by_userId", ["userId"]),

  company: defineTable({
    name: v.string(),
    vision: v.string(),
    mission: v.string(),
    values: v.array(v.string()),
    goals: v.array(v.string()),
    teamId: v.id("teams"),
    userId: v.id("users"),
  }).index("by_teamId", ["teamId"])
    .index("by_userId", ["userId"]),

  kpis: defineTable(vKpi)
    .index("by_teamId", ["teamId"])
    .index("by_companyId", ["companyId"])
    .index("by_employeeId", ["employeeId"]),

  // Store extra metadata for a chat beyond the thread managed by the agent package
  chats: defineTable({
    userId: v.id("users"), // User can see all their AI owned chats
    chatOwnerId: v.optional(v.union(v.id("employees"), v.id("users"), v.string())), // Owner of the chat, if user talks to an employee, user will be the owner, if an employee talks to another employee, the employee will be the owner
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

  // Teams are used to group employees together
  teams: defineTable({
    userId: v.id("users"), // User can see all their AI owned teams
    name: v.string(),
    description: v.string(),
    clusterPosition: v.optional(v.array(v.number())), // [x, y, z] position for team cluster
    deskCount: v.optional(v.number()), // Number of desks for this team
  }).index("by_userId", ["userId"]),

  // Employees are the AI agents in the office
  employees: defineTable({
    teamId: v.id("teams"), // Employee belongs to a team
    userId: v.id("users"), // The user who owns these AI employees
    name: v.string(),
    jobTitle: v.string(),
    jobDescription: v.string(),
    gender: v.union(v.literal("male"), v.literal("female")),
    background: v.string(), // The backstory
    personality: v.string(), // Affects how they respond to the user
    // TODO: Add style configs for the employee appearance
    status: vEmployeeStatuses,
    statusMessage: v.string(),
    isSupervisor: v.boolean(), // If the employee is a supervisor
    isCEO: v.boolean(), // If the employee is the CEO of the company
    deskIndex: v.optional(v.number()), // Which desk position in their team (0-based)
  }).index("by_teamId", ["teamId"])
    .index("by_userId", ["userId"]),

  // Employees can have tools assigned to them
  employeeToTools: defineTable({
    employeeId: v.id("employees"),
    toolId: v.id("tools"),
  }).index("by_employeeId", ["employeeId"])
    .index("by_toolId", ["toolId"]),

  // Entities that agents can act on
  companyFiles: defineTable({
    name: v.string(),
    mimeType: v.string(),
    size: v.number(),
    aiSummary: v.optional(v.string()),
    userId: v.id("users"),
    employeeId: v.optional(v.id("employees")),
    storageId: v.id("_storage"),
    embeddingStatus: v.union(
      v.literal("pending"),
      v.literal("in-progress"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("not-applicable"),
    ),
    embeddingProgress: v.optional(v.number()),
    embeddingMessage: v.optional(v.string()),
  })
    .index("by_employeeId", ["employeeId"]),

  companyFileEmbeddingChunks: defineTable({
    companyFileId: v.id("companyFiles"),
    metadata: v.string(),
    text: v.string(),
    page: v.optional(v.number()),
    embedding: v.array(v.float64()),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,
    filterFields: ["companyFileId", "page"],
  }).index("by_companyFileId", ["companyFileId"]),

  tags: defineTable({
    name: v.string(),
    embedding: v.array(v.float64()),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,
  }),

  companyFilesToTags: defineTable({
    companyFileId: v.id("companyFiles"),
    tagId: v.id("tags"),
  }).index("by_companyFileId", ["companyFileId"])
    .index("by_tagId", ["tagId"]),

  tools: defineTable({
    name: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("mcp"),
      v.literal("api"),
      v.literal("prebuilt")
    ),
    config: v.any(),
    userId: v.id("users"),
  }).index("by_userId", ["userId"]),

  // For streaming tool updates
  backgroundJobStatuses: defineTable({
    toolCallId: v.string(),
    threadId: v.string(),
    messageId: v.string(),
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
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_artifactId", ["artifactId"])
    .index("by_userId", ["userId"]),

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
    done: v.boolean(),
  }).index("by_threadId", ["threadId"]),

  // Feedback and learning
  votes: defineTable({
    messageId: v.string(),
    isUpvoted: v.boolean(),
    threadId: v.string(),
    comment: v.optional(v.string()),
  }).index("by_messageId", ["messageId"])
    .index("by_threadId", ["threadId"]),

  memories: defineTable({
    key: v.string(),
    value: v.string(),
    scope: v.union(
      v.literal("conversation"), // Tied to a specific chat conversation
      v.literal("personal"), // Private to the creating employee
      v.literal("team"), // Accessible to all team members
      v.literal("user") // Global user preferences
    ),
    threadId: v.string(), // Representing chatId
    employeeId: v.optional(v.id("employees")), // Creator of the memory
    teamId: v.optional(v.id("teams")),
    userId: v.id("users"),
    embedding: v.array(v.float64()), // For semantic search
  }).index("by_threadId", ["threadId"])
    .index("by_userId", ["userId"])
    .index("by_employeeId", ["employeeId"])
    .index("by_teamId", ["teamId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["scope", "employeeId", "teamId", "userId", "threadId"],
    }),

  // If you want to track usage on a granular level, you could do something like this:
  rawUsage: defineTable({
    userId: v.string(),
    agentName: v.optional(v.string()),
    model: v.string(),
    provider: v.string(),

    // stats
    usage: vUsage,
    providerMetadata: vProviderMetadata,
    billingPeriod: v.string(), // When the usage period ended
  }).index("billingPeriod_userId", ["billingPeriod", "userId"]),

  invoices: defineTable({
    userId: v.string(),
    billingPeriod: v.string(),
    amount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed")
    ),
  }).index("billingPeriod_userId", ["billingPeriod", "userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
