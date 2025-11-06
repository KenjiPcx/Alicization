import { defineTable } from "convex/server";
import { v } from "convex/values";

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

export const officeSystemTables = {
    companies: defineTable({
        name: v.string(),
        description: v.string(),
        vision: v.string(),
        mission: v.string(),
        values: v.array(v.string()),
        goals: v.array(v.string()),
        userId: v.string(),
    }).index("by_userId", ["userId"]),

    kpis: defineTable(vKpi)
        .index("by_teamId", ["teamId"])
        .index("by_companyId", ["companyId"])
        .index("by_employeeId", ["employeeId"]),

    // Teams are used to group employees together
    teams: defineTable({
        userId: v.string(), // User can see all their AI owned teams
        name: v.string(),
        description: v.string(),
        clusterPosition: v.optional(v.array(v.number())), // [x, y, z] position for team cluster
        deskCount: v.optional(v.number()), // Number of desks for this team
        companyId: v.optional(v.id("companies")), // Temp optional for development
    }).index("by_userId", ["userId"]),

    // Employees are the AI agents in the office
    employees: defineTable({
        teamId: v.id("teams"), // Employee belongs to a team
        userId: v.string(), // The user who owns these AI employees
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
        userId: v.string(), // User who owns/created this skill
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

    // Toolsets are collections of related tools (e.g. "File Management", "Python Interpreter")
    toolsets: defineTable({
        name: v.string(),
        description: v.string(),
        category: v.optional(v.string()),
        type: vToolsetTypes,
        toolsetConfig: v.optional(vMcpConfig), // Only MCP toolsets need configuration
        userId: v.string(),
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
};