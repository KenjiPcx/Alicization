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
  companyId: v.optional(v.id("companies")),
  teamId: v.optional(v.id("teams")),
  employeeId: v.optional(v.id("employees")),
  scope: vKpiScopes,
  status: vKpiStatuses,
  quarter: vKpiQuarters,
  year: v.number(),
  statusMessage: v.optional(v.string()),
})

export const vProficiencyLevels = v.union(
  v.literal("newbie"),
  v.literal("novice"),
  v.literal("competent"),
  v.literal("proficient"),
  v.literal("expert"),
)

export const vBuiltInRoles = v.union(
  v.literal("ceo"),     // Chief Executive Officer
  v.literal("coo"),     // Chief Operating Officer  
  v.literal("chro"),    // Chief Human Resources Officer
  v.literal("cfo"),     // Chief Financial Officer
  v.literal("cmo"),     // Chief Marketing Officer
  v.literal("cso"),     // Chief Sales Officer
  v.literal("cto"),     // Chief Technology Officer
  v.literal("office-manager"), // Office Manager
)

export const vToolsetTypes = v.union(
  v.literal("builtin"),
  v.literal("mcp"),
)

export const vMcpConnectionTypes = v.union(
  v.literal("sse"),
  v.literal("stdio"),
)

export const vMcpConfig = v.object({
  connectionType: vMcpConnectionTypes,
  connectionUrl: v.optional(v.string()), // For SSE connections
  runCommand: v.optional(v.string()), // For stdio connections
  args: v.optional(v.array(v.string())), // Command arguments for stdio
  env: v.optional(v.object({
    apiKey: v.string(),
  })), // Environment variables
})

export const vAttachment = v.object({
  url: v.string(),
  name: v.optional(v.string()),
  contentType: v.optional(v.string()),
})

export const applicationTables = {
  // Store extra metadata for a user beyond the user managed by the auth package
  usersMetadata: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("regular"), v.literal("pro")),
    onboardingCompleted: v.optional(v.boolean()),
    onboardingCompletedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  companies: defineTable({
    name: v.string(),
    description: v.string(),
    vision: v.string(),
    mission: v.string(),
    values: v.array(v.string()),
    goals: v.array(v.string()),
    userId: v.id("users"),
  }).index("by_userId", ["userId"]),

  kpis: defineTable(vKpi)
    .index("by_teamId", ["teamId"])
    .index("by_companyId", ["companyId"])
    .index("by_employeeId", ["employeeId"]),

  // Define different types of 3D objects that can be rendered in the office
  meshTypes: defineTable({
    name: v.string(), // "plant", "couch", "team-cluster", "bookshelf", etc.
    category: v.union(
      v.literal("furniture"),
      v.literal("cluster"),
      v.literal("decoration"),
      v.literal("equipment"),
    ),
    displayName: v.string(), // "Office Plant", "Team Desk Cluster", etc.
    description: v.optional(v.string()),
    defaultScale: v.optional(v.array(v.number())), // [x, y, z] default scale
    defaultRotation: v.optional(v.array(v.number())), // [x, y, z] default rotation
    isDraggable: v.boolean(), // Can this object type be moved?
    metadata: v.optional(v.object({
      // Extensible metadata for different object types
      deskCount: v.optional(v.number()), // For team clusters
      color: v.optional(v.string()), // Default color
      material: v.optional(v.string()), // Material type
    })),
  }).index("by_name", ["name"])
    .index("by_category", ["category"]),

  // Store positions and properties for all draggable objects in the office
  officeObjects: defineTable({
    companyId: v.id("companies"),
    meshType: v.string(), // References meshTypes.name
    identifier: v.string(), // Unique identifier like "team-engineering", "plant-lobby-1", etc.
    position: v.array(v.number()), // [x, y, z] world position
    rotation: v.optional(v.array(v.number())), // [x, y, z] rotation in radians
    scale: v.optional(v.array(v.number())), // [x, y, z] scale multiplier
    metadata: v.optional(v.object({
      // Object-specific metadata
      teamId: v.optional(v.id("teams")), // For team-cluster type
      color: v.optional(v.string()), // Custom color override
    })),
    createdAt: v.optional(v.number()), // TODO: Remove this field
    updatedAt: v.optional(v.number()), // TODO: Remove this field
  }).index("by_companyId", ["companyId"])
    .index("by_meshType", ["meshType"])
    .index("by_identifier", ["identifier"])
    .index("by_companyId_meshType", ["companyId", "meshType"]),

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

  // Teams are used to group employees together
  teams: defineTable({
    userId: v.id("users"), // User can see all their AI owned teams
    name: v.string(),
    description: v.string(),
    clusterPosition: v.optional(v.array(v.number())), // [x, y, z] position for team cluster
    deskCount: v.optional(v.number()), // Number of desks for this team
    companyId: v.optional(v.id("companies")), // Temp optional for development
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
    isCEO: v.optional(v.boolean()), // TODO: Remove this field
    builtInRole: v.optional(vBuiltInRoles), // Built-in system roles (CEO, HR, IT, Office Manager)
    deskIndex: v.optional(v.number()), // Which desk position in their team (0-based)
    companyId: v.id("companies"), // Temp optional for development
  }).index("by_teamId", ["teamId"])
    .index("by_userId", ["userId"])
    .index("by_builtInRole", ["builtInRole"]),

  // Employees can have toolsets assigned to them
  employeeToToolsets: defineTable({
    employeeId: v.id("employees"),
    toolsetId: v.id("toolsets"),
  }).index("by_employeeId", ["employeeId"])
    .index("by_toolsetId", ["toolsetId"]),

  // Skills that employees can have
  skills: defineTable({
    name: v.string(),
    description: v.string(),
    userId: v.id("users"), // User who owns/created this skill
    createdAt: v.number(),
    proficiencyLevel: vProficiencyLevels,
    stats: v.optional(v.object({
      executionCount: v.number(),
      averageExecutionTime: v.number(),
      averageExecutionSuccessRate: v.number(),
    })), // For optimization in the future
    imageStorageId: v.id("_storage"),
  }).index("by_userId", ["userId"]),

  // Junction table for employee skills
  employeeToSkills: defineTable({
    employeeId: v.id("employees"),
    skillId: v.id("skills"),
    dateAcquired: v.number(), // When the employee acquired this skill
    notes: v.optional(v.string()), // Optional notes about how they learned it or specific expertise
  }).index("by_employeeId", ["employeeId"])
    .index("by_skillId", ["skillId"])
    .index("by_employeeId_skillId", ["employeeId", "skillId"]),

  // Entities that agents can act on
  companyFiles: defineTable({
    artifactGroupId: v.optional(v.string()),
    type: v.union(v.literal("artifact"), v.literal("information")),
    name: v.string(),
    mimeType: v.optional(v.string()),
    size: v.optional(v.number()), // TODO: Remove this field
    aiSummary: v.optional(v.string()),
    companyId: v.id("companies"),
    userId: v.optional(v.id("users")),
    employeeId: v.optional(v.id("employees")),
    skillId: v.optional(v.id("skills")),
    storageId: v.optional(v.id("_storage")), // TODO: Remove this field
    fileUrl: v.optional(v.string()),
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
    .index("by_employeeId", ["employeeId"])
    .index("by_artifactGroupId", ["artifactGroupId"]),

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

  // Toolsets are collections of related tools (e.g. "File Management", "Python Interpreter")
  toolsets: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.optional(v.string()),
    type: vToolsetTypes,
    toolsetConfig: v.optional(vMcpConfig), // Only MCP toolsets need configuration
    userId: v.id("users"),
    companyId: v.optional(v.id("companies")), // Toolsets can be company-specific
    isActive: v.optional(v.boolean()), // Whether the toolset is currently active
  }).index("by_userId", ["userId"])
    .index("by_companyId", ["companyId"])
    .index("by_type", ["type"]),

  // Individual tools within toolsets (e.g. "createArtifact", "uploadFile")
  tools: defineTable({
    name: v.string(),
    description: v.string(),
    toolsetId: v.id("toolsets"),
  }).index("by_toolsetId", ["toolsetId"]),

  // For streaming tool updates
  backgroundJobStatuses: defineTable({
    toolCallId: v.string(),
    threadId: v.string(),
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
    status: v.optional(v.union(v.literal("in-progress"), v.literal("completed"), v.literal("blocked"))),
    done: v.optional(v.boolean()),
    watchdogScheduledFunctionId: v.optional(v.id("_scheduled_functions")),
    context: v.optional(v.object({
      userId: v.id("users"),
      employeeId: v.id("employees"),
      teamId: v.id("teams"),
    })),
  }).index("by_threadId", ["threadId"]),

  // Human collaboration requests
  userTasks: defineTable({
    threadId: v.string(),
    employeeId: v.id("employees"),
    userId: v.id("users"),
    message: v.string(),
    type: v.union(v.literal("approval"), v.literal("review"), v.literal("question"), v.literal("permission")),
    context: v.string(),
    status: v.union(v.literal("pending"), v.literal("responded"), v.literal("cancelled")),
    response: v.optional(v.string()),
    respondedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_threadId", ["threadId"])
    .index("by_status", ["status"])
    .index("by_userId", ["userId"]),

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
