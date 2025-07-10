import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { vKpiScopes, vKpiQuarters, vKpiStatuses, vKpi } from "./schema";

/**
 * Get KPIs with filtering by scope
 */
export const getKPIs = query({
    args: v.object({
        scope: v.optional(vKpiScopes),
        companyId: v.optional(v.id("companies")),
        teamId: v.optional(v.id("teams")),
        employeeId: v.optional(v.id("employees")),
        quarter: v.optional(vKpiQuarters),
        year: v.optional(v.number()),
        status: v.optional(vKpiStatuses),
    }),
    handler: async (ctx, args) => {
        let kpis;

        // Apply filters based on scope
        if (args.scope === "company" && args.companyId) {
            kpis = await ctx.db.query("kpis").withIndex("by_companyId", q => q.eq("companyId", args.companyId)).collect();
        } else if (args.scope === "team" && args.teamId) {
            kpis = await ctx.db.query("kpis").withIndex("by_teamId", q => q.eq("teamId", args.teamId)).collect();
        } else if (args.scope === "employee" && args.employeeId) {
            kpis = await ctx.db.query("kpis").withIndex("by_employeeId", q => q.eq("employeeId", args.employeeId)).collect();
        } else {
            kpis = await ctx.db.query("kpis").collect();
        }

        // Apply additional filters
        return kpis.filter(kpi => {
            if (args.scope && kpi.scope !== args.scope) return false;
            if (args.quarter && kpi.quarter !== args.quarter) return false;
            if (args.year && kpi.year !== args.year) return false;
            if (args.status && kpi.status !== args.status) return false;
            return true;
        });
    },
});

/**
 * Get KPI dashboard summary
 */
export const getKPIDashboard = query({
    args: v.object({
        scope: v.optional(vKpiScopes),
        companyId: v.optional(v.id("companies")),
        teamId: v.optional(v.id("teams")),
        employeeId: v.optional(v.id("employees")),
        quarter: v.optional(vKpiQuarters),
        year: v.optional(v.number()),
    }),
    handler: async (ctx, args) => {
        // Get all relevant KPIs
        const allKPIs = await ctx.db.query("kpis").collect();

        // Filter KPIs based on arguments
        const filteredKPIs = allKPIs.filter(kpi => {
            if (args.companyId && kpi.companyId !== args.companyId) return false;
            if (args.teamId && kpi.teamId !== args.teamId) return false;
            if (args.employeeId && kpi.employeeId !== args.employeeId) return false;
            if (args.quarter && kpi.quarter !== args.quarter) return false;
            if (args.year && kpi.year !== args.year) return false;
            return true;
        });

        // Calculate summary statistics
        const totalKPIs = filteredKPIs.length;
        const completedKPIs = filteredKPIs.filter(kpi => kpi.status === "completed").length;
        const inProgressKPIs = filteredKPIs.filter(kpi => kpi.status === "in-progress").length;
        const pendingKPIs = filteredKPIs.filter(kpi => kpi.status === "pending").length;
        const failedKPIs = filteredKPIs.filter(kpi => kpi.status === "failed").length;

        // Calculate progress percentages
        const progressKPIs = filteredKPIs.filter(kpi =>
            kpi.currentValue !== undefined && kpi.target !== undefined
        ).map(kpi => {
            const progress = kpi.direction === "increase"
                ? (kpi.currentValue! / kpi.target!) * 100
                : (kpi.target! / kpi.currentValue!) * 100;
            return {
                ...kpi,
                progressPercentage: Math.min(Math.max(progress, 0), 100),
            };
        });

        return {
            summary: {
                totalKPIs,
                completedKPIs,
                inProgressKPIs,
                pendingKPIs,
                failedKPIs,
                completionRate: totalKPIs > 0 ? (completedKPIs / totalKPIs) * 100 : 0,
            },
            kpis: filteredKPIs,
            progressKPIs,
        };
    },
});

/**
 * Create a new KPI
 */
export const createKPI = mutation({
    args: vKpi,
    handler: async (ctx, args) => {
        const kpiId = await ctx.db.insert("kpis", args);
        return kpiId;
    },
});

/**
 * Update KPI progress and status
 */
export const updateKPI = mutation({
    args: v.object({
        kpiId: v.id("kpis"),
        currentValue: v.optional(v.number()),
        target: v.optional(v.number()),
        status: v.optional(vKpiStatuses),
        statusMessage: v.optional(v.string()),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
    }),
    handler: async (ctx, args) => {
        const kpi = await ctx.db.get(args.kpiId);
        if (!kpi) {
            throw new Error("KPI not found");
        }

        const updates: any = {};
        if (args.currentValue !== undefined) updates.currentValue = args.currentValue;
        if (args.target !== undefined) updates.target = args.target;
        if (args.status !== undefined) updates.status = args.status;
        if (args.statusMessage !== undefined) updates.statusMessage = args.statusMessage;
        if (args.name !== undefined) updates.name = args.name;
        if (args.description !== undefined) updates.description = args.description;

        await ctx.db.patch(args.kpiId, updates);

        return args.kpiId;
    },
});

/**
 * Delete a KPI
 */
export const deleteKPI = mutation({
    args: v.object({
        kpiId: v.id("kpis"),
    }),
    handler: async (ctx, args) => {
        const kpi = await ctx.db.get(args.kpiId);
        if (!kpi) {
            throw new Error("KPI not found");
        }

        await ctx.db.delete(args.kpiId);

        return { success: true };
    },
});