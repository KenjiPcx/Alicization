import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { tool } from "ai";
import { ActionCtx } from "@/convex/_generated/server";
import { ScopeAndId } from "@/lib/types";
import { withToolErrorHandling } from "@/lib/ai/tool-utils";

/**
 * View KPI dashboard - generalized for company/team/employee
 */
export const createKPIDashboardTool = (
    ctx: ActionCtx,
    scopeAndId: ScopeAndId,
    userId: Id<"users">
) => tool({
    description: `View KPI dashboard with summary and progress for the ${scopeAndId.scope}`,
    parameters: z.object({
        quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]).optional().describe("Filter by quarter"),
        year: z.number().optional().describe("Filter by year"),
    }),
    execute: async (args) => {
        return withToolErrorHandling(
            async () => {
                const dashboard = await ctx.runQuery(api.kpis.getKPIDashboard, {
                    ...scopeAndId,
                    quarter: args.quarter,
                    year: args.year,
                });

                return { dashboard };
            },
            {
                operation: "KPI dashboard retrieval",
                context: `for ${scopeAndId.scope}`,
                includeTechnicalDetails: true
            },
            (result) => ({
                message: `KPI dashboard retrieved successfully for ${scopeAndId.scope}`,
                dashboard: result.dashboard
            })
        );
    },
});

/**
 * Create a new KPI - generalized for company/team/employee
 */
export const createKPITool = (
    ctx: ActionCtx,
    scopeAndId: ScopeAndId,
    userId: Id<"users">
) => tool({
    description: `Create a new KPI (Key Performance Indicator) for the ${scopeAndId.scope}`,
    parameters: z.object({
        name: z.string().describe("The name of the KPI"),
        description: z.string().describe("Description of what this KPI measures"),
        direction: z.enum(["increase", "decrease"]).describe("Whether higher or lower values are better"),
        unit: z.string().describe("The unit of measurement (e.g., '$', '%', 'units')"),
        target: z.number().optional().describe("The target value for this KPI"),
        currentValue: z.number().optional().describe("The current value of this KPI"),
        quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]).describe("Which quarter this KPI is for"),
        year: z.number().describe("Which year this KPI is for"),
        statusMessage: z.string().optional().describe("Initial status message"),
    }),
    execute: async (args) => {
        return withToolErrorHandling(
            async () => {
                const kpiData = {
                    name: args.name,
                    description: args.description,
                    direction: args.direction,
                    unit: args.unit,
                    target: args.target,
                    currentValue: args.currentValue,
                    quarter: args.quarter,
                    year: args.year,
                    status: "pending" as const,
                    statusMessage: args.statusMessage,
                    ...scopeAndId,
                };

                const kpiId = await ctx.runMutation(api.kpis.createKPI, kpiData);

                return { kpiId };
            },
            {
                operation: "KPI creation",
                context: `for ${scopeAndId.scope}`,
                includeTechnicalDetails: true
            },
            (result) => ({
                message: `KPI created successfully for ${scopeAndId.scope}`,
                kpiId: result.kpiId,
            })
        );
    },
});

/**
 * Update KPI progress - generalized for company/team/employee
 */
export const createUpdateKPITool = (
    ctx: ActionCtx,
    scopeAndId: ScopeAndId,
    userId: Id<"users">
) => tool({
    description: `Update the progress of a KPI for the ${scopeAndId.scope}`,
    parameters: z.object({
        kpiName: z.string().describe("The name of the KPI to update"),
        currentValue: z.number().optional().describe("The new current value"),
        target: z.number().optional().describe("The new target value"),
        status: z.enum(["pending", "in-progress", "completed", "failed"]).optional().describe("The new status"),
        statusMessage: z.string().optional().describe("A message explaining the status update"),
    }),
    execute: async (args) => {
        return withToolErrorHandling(
            async () => {
                // Find the KPI by name within the scope
                const kpis = await ctx.runQuery(api.kpis.getKPIs, {
                    ...scopeAndId,
                });

                const kpi = kpis.find(k => k.name === args.kpiName);

                if (!kpi) {
                    throw new Error(`KPI "${args.kpiName}" not found in ${scopeAndId.scope}`);
                }

                await ctx.runMutation(api.kpis.updateKPI, {
                    kpiId: kpi._id,
                    currentValue: args.currentValue,
                    target: args.target,
                    status: args.status,
                    statusMessage: args.statusMessage,
                });

                return {
                    kpiName: args.kpiName,
                    kpi: {
                        name: args.kpiName,
                        currentValue: args.currentValue ?? kpi.currentValue,
                        target: args.target ?? kpi.target,
                        status: args.status ?? kpi.status,
                        statusMessage: args.statusMessage ?? kpi.statusMessage,
                    }
                };
            },
            {
                operation: "KPI update",
                context: `for ${scopeAndId.scope}`,
                includeTechnicalDetails: true
            },
            (result) => ({
                message: `KPI "${result.kpiName}" updated successfully`,
                kpi: result.kpi
            })
        );
    },
});

/**
 * Remove/Delete a KPI - generalized for company/team/employee
 */
export const createRemoveKPITool = (
    ctx: ActionCtx,
    scopeAndId: ScopeAndId,
    userId: Id<"users">
) => tool({
    description: `Remove a KPI that is no longer needed from the ${scopeAndId.scope}`,
    parameters: z.object({
        kpiName: z.string().describe("The name of the KPI to remove"),
    }),
    execute: async (args) => {
        return withToolErrorHandling(
            async () => {
                // Find the KPI by name within the scope
                const kpis = await ctx.runQuery(api.kpis.getKPIs, {
                    ...scopeAndId,
                });

                const kpi = kpis.find(k => k.name === args.kpiName);

                if (!kpi) {
                    throw new Error(`KPI "${args.kpiName}" not found in ${scopeAndId.scope}`);
                }

                await ctx.runMutation(api.kpis.deleteKPI, {
                    kpiId: kpi._id,
                });

                return {
                    kpiName: args.kpiName,
                    removedKPI: {
                        name: kpi.name,
                        description: kpi.description,
                    }
                };
            },
            {
                operation: "KPI removal",
                context: `for ${scopeAndId.scope}`,
                includeTechnicalDetails: true
            },
            (result) => ({
                message: `KPI "${result.kpiName}" removed successfully from ${scopeAndId.scope}`,
                removedKPI: result.removedKPI
            })
        );
    },
});

/**
 * List KPIs - generalized for company/team/employee
 */
export const createListKPIsTool = (
    ctx: ActionCtx,
    scopeAndId: ScopeAndId,
    userId: Id<"users">
) => tool({
    description: `List all KPIs for the ${scopeAndId.scope}`,
    parameters: z.object({
        quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]).optional().describe("Filter by quarter"),
        year: z.number().optional().describe("Filter by year"),
        status: z.enum(["pending", "in-progress", "completed", "failed"]).optional().describe("Filter by status"),
    }),
    execute: async (args) => {
        return withToolErrorHandling(
            async () => {
                const kpis = await ctx.runQuery(api.kpis.getKPIs, {
                    quarter: args.quarter,
                    year: args.year,
                    status: args.status,
                    ...scopeAndId,
                });

                return {
                    kpisCount: kpis.length,
                    kpis: kpis.map(kpi => ({
                        name: kpi.name,
                        description: kpi.description,
                        currentValue: kpi.currentValue,
                        target: kpi.target,
                        unit: kpi.unit,
                        status: kpi.status,
                        quarter: kpi.quarter,
                        year: kpi.year,
                        direction: kpi.direction,
                    }))
                };
            },
            {
                operation: "KPI listing",
                context: `for ${scopeAndId.scope}`,
                includeTechnicalDetails: true
            },
            (result) => ({
                message: `Found ${result.kpisCount} KPIs for ${scopeAndId.scope}`,
                kpis: result.kpis
            })
        );
    },
});

/**
 * Helper function to create a complete KPI toolset for a specific context
 */
export const createKPIToolset = (
    ctx: ActionCtx,
    scopeAndId: ScopeAndId,
    userId: Id<"users">
) => ({
    viewKPIDashboard: createKPIDashboardTool(ctx, scopeAndId, userId),
    createKPI: createKPITool(ctx, scopeAndId, userId),
    updateKPI: createUpdateKPITool(ctx, scopeAndId, userId),
    removeKPI: createRemoveKPITool(ctx, scopeAndId, userId),
    listKPIs: createListKPIsTool(ctx, scopeAndId, userId),
});

/**
 * Helper functions to resolve scope and IDs for different contexts
 */
export const resolveCompanyScope = async (
    ctx: ActionCtx,
    userId: Id<"users">
): Promise<ScopeAndId> => {
    const company = await ctx.runQuery(api.companies.getCompany, { userId });
    if (!company) {
        throw new Error("No company found. Please create a company first.");
    }
    return { scope: "company", companyId: company._id };
};

export const resolveTeamScope = (teamId: Id<"teams">): ScopeAndId => {
    return { scope: "team", teamId };
};

export const resolveEmployeeScope = (employeeId: Id<"employees">): ScopeAndId => {
    return { scope: "employee", employeeId };
};