import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { vMcpConfig, vToolsetTypes } from "./lib/validators";
import { getAuthUserId } from "@/convex/utils";

export const createToolset = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        category: v.optional(v.string()),
        type: vToolsetTypes,
        toolsetConfig: v.optional(vMcpConfig),
        companyId: v.optional(v.id("companies")),
    },
    handler: async (ctx, args): Promise<Id<"toolsets">> => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const toolsetId = await ctx.db.insert("toolsets", {
            ...args,
            userId,
            isActive: true,
        });

        return toolsetId;
    },
})

export const getToolsetsByCompany = query({
    args: {
        companyId: v.optional(v.id("companies")),
    },
    handler: async (ctx, args) => {
        const { companyId } = args;

        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const toolsets = await ctx.db.query("toolsets")
            .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
            .collect();

        return toolsets;
    },
})

export const updateToolset = mutation({
    args: {
        toolsetId: v.id("toolsets"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        category: v.optional(v.string()),
        toolsetConfig: v.optional(vMcpConfig),
        isActive: v.optional(v.boolean()),
        type: v.optional(vToolsetTypes),
    },
    handler: async (ctx, args) => {
        const { toolsetId, ...updates } = args;

        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Check if user owns this toolset
        const toolset = await ctx.db.get(toolsetId);
        if (!toolset || toolset.userId !== userId) {
            throw new Error("Toolset not found or access denied");
        }

        await ctx.db.patch(toolsetId, updates);
        return toolsetId;
    },
})

export const deleteToolset = mutation({
    args: {
        toolsetId: v.id("toolsets"),
    },
    handler: async (ctx, args) => {
        const { toolsetId } = args;

        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Check if user owns this toolset
        const toolset = await ctx.db.get(toolsetId);
        if (!toolset || toolset.userId !== userId) {
            throw new Error("Toolset not found or access denied");
        }

        // Don't allow deleting built-in toolsets
        if (toolset.type === "builtin") {
            throw new Error("Cannot delete built-in toolsets");
        }

        await ctx.db.delete(toolsetId);
        return toolsetId;
    },
})

export const seedBuiltInToolsets = internalMutation({
    args: {
        userId: v.id("users"),
        companyId: v.id("companies"),
    },
    handler: async (ctx, args) => {
        const { userId, companyId } = args;

        // Check if built-in toolsets already exist for this company
        const existingToolsets = await ctx.db.query("toolsets")
            .withIndex("by_companyId", (q) => q.eq("companyId", companyId))
            .filter((q) => q.eq(q.field("type"), "builtin"))
            .collect();

        if (existingToolsets.length > 0) {
            return { message: "Built-in toolsets already seeded for this company" };
        }

        const builtInToolsets = [
            {
                name: "Artifact Management",
                description: "Create and manage artifacts like documents, code, and presentations",
                category: "Content Creation",
            },
            {
                name: "Planning System",
                description: "Create and manage tasks, todos, and project workflows",
                category: "Project Management",
            },
            {
                name: "Memory Management",
                description: "Store and retrieve contextual memories across conversations",
                category: "Data Management",
            },
            {
                name: "Human Collaboration",
                description: "Request human input, approval, or review during task execution",
                category: "Collaboration",
            },
            {
                name: "Learning System",
                description: "Learn new workflows and skills dynamically from user teaching",
                category: "Learning",
            },
            {
                name: "Office Management",
                description: "Access specialized micro applications for data dashboards and management",
                category: "Office Management",
            },
            {
                name: "File Management",
                description: "Upload, organize, and manage company files and documents",
                category: "Content Management",
            },
            {
                name: "KPI Management",
                description: "Create, track, and update key performance indicators",
                category: "Analytics",
            },
        ];

        const createdToolsets = [];
        for (const toolset of builtInToolsets) {
            const toolsetId = await ctx.db.insert("toolsets", {
                name: toolset.name,
                description: toolset.description,
                category: toolset.category,
                type: "builtin",
                userId,
                companyId,
                isActive: true,
            });
            createdToolsets.push(toolsetId);
        }

        return {
            message: `Successfully seeded ${createdToolsets.length} built-in toolsets`,
            toolsetIds: createdToolsets
        };
    },
})

// Toolset assignment functions
export const assignToolsetToEmployee = mutation({
    args: {
        employeeId: v.id("employees"),
        toolsetId: v.id("toolsets"),
    },
    handler: async (ctx, args) => {
        const { employeeId, toolsetId } = args;

        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Check if employee exists and user owns it
        const employee = await ctx.db.get(employeeId);
        if (!employee || employee.userId !== userId) {
            throw new Error("Employee not found or access denied");
        }

        // Check if toolset exists and user owns it
        const toolset = await ctx.db.get(toolsetId);
        if (!toolset || toolset.userId !== userId) {
            throw new Error("Toolset not found or access denied");
        }

        // Check if assignment already exists
        const existingAssignment = await ctx.db.query("employeeToToolsets")
            .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId))
            .filter((q) => q.eq(q.field("toolsetId"), toolsetId))
            .first();

        if (existingAssignment) {
            throw new Error("Toolset already assigned to this employee");
        }

        const assignmentId = await ctx.db.insert("employeeToToolsets", {
            employeeId,
            toolsetId,
        });

        return assignmentId;
    },
})

export const removeToolsetFromEmployee = mutation({
    args: {
        employeeId: v.id("employees"),
        toolsetId: v.id("toolsets"),
    },
    handler: async (ctx, args) => {
        const { employeeId, toolsetId } = args;

        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Check if employee exists and user owns it
        const employee = await ctx.db.get(employeeId);
        if (!employee || employee.userId !== userId) {
            throw new Error("Employee not found or access denied");
        }

        // Find the assignment
        const assignment = await ctx.db.query("employeeToToolsets")
            .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId))
            .filter((q) => q.eq(q.field("toolsetId"), toolsetId))
            .first();

        if (!assignment) {
            throw new Error("Toolset assignment not found");
        }

        await ctx.db.delete(assignment._id);
        return assignment._id;
    },
})

export const getToolsetsForEmployee = query({
    args: {
        employeeId: v.id("employees"),
    },
    handler: async (ctx, args) => {
        const { employeeId } = args;

        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Check if employee exists and user owns it
        const employee = await ctx.db.get(employeeId);
        if (!employee || employee.userId !== userId) {
            throw new Error("Employee not found or access denied");
        }

        // Get toolset assignments
        const assignments = await ctx.db.query("employeeToToolsets")
            .withIndex("by_employeeId", (q) => q.eq("employeeId", employeeId))
            .collect();

        // Get the actual toolsets
        const toolsets = [];
        for (const assignment of assignments) {
            const toolset = await ctx.db.get(assignment.toolsetId);
            if (toolset && toolset.isActive !== false) {
                toolsets.push(toolset);
            }
        }

        return toolsets;
    },
})

export const getEmployeesWithToolset = query({
    args: {
        toolsetId: v.id("toolsets"),
    },
    handler: async (ctx, args) => {
        const { toolsetId } = args;

        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Check if toolset exists and user owns it
        const toolset = await ctx.db.get(toolsetId);
        if (!toolset || toolset.userId !== userId) {
            throw new Error("Toolset not found or access denied");
        }

        // Get employee assignments
        const assignments = await ctx.db.query("employeeToToolsets")
            .withIndex("by_toolsetId", (q) => q.eq("toolsetId", toolsetId))
            .collect();

        // Get the actual employees
        const employees = [];
        for (const assignment of assignments) {
            const employee = await ctx.db.get(assignment.employeeId);
            if (employee && employee.userId === userId) {
                employees.push(employee);
            }
        }

        return employees;
    },
})

// Tools within toolsets
export const createTool = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        toolsetId: v.id("toolsets"),
        functionName: v.string(),
        parameters: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Check if user owns the toolset
        const toolset = await ctx.db.get(args.toolsetId);
        if (!toolset || toolset.userId !== userId) {
            throw new Error("Toolset not found or access denied");
        }

        const toolId = await ctx.db.insert("tools", args);
        return toolId;
    },
})

export const getToolsInToolset = query({
    args: {
        toolsetId: v.id("toolsets"),
    },
    handler: async (ctx, args) => {
        const { toolsetId } = args;

        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Check if user owns the toolset
        const toolset = await ctx.db.get(toolsetId);
        if (!toolset || toolset.userId !== userId) {
            throw new Error("Toolset not found or access denied");
        }

        const tools = await ctx.db.query("tools")
            .withIndex("by_toolsetId", (q) => q.eq("toolsetId", toolsetId))
            .collect();

        return tools;
    },
}) 