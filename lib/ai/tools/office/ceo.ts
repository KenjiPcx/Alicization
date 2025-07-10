/**
 * CEO tools
 * - Create employees
 * - Manage KPIs
 * - Manage teams
 * - Delegate projects
 */

import { api, internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { createTool } from "@convex-dev/agent";
import dedent from "dedent";
import { z } from "zod";
import { createKPIToolset, resolveCompanyScope } from "../advanced/kpi";
import { createOpenOfficeMicroAppTool } from "../advanced/office-micro-app";
import { ActionCtx } from "@/convex/_generated/server";

export const useCeoToolsPrompt = dedent`
    # CEO Tools
    The CEO tools let you manage the company at a high level, you can:
    - View all teams in the office
    - Manage teams for the office
    - Manage company details (name, vision, mission, values, goals)
    - Open micro-apps for visual dashboards (KPI dashboard, company config, employee config)
    - Manage KPIs for the company
    - View KPI dashboard and performance metrics
    - Create, update, and remove company-level KPIs

    ## Common Workflows
    - Company Setup: "Set our company vision and mission" or "Open the company config"
    - Team Creation: "Can we add a team / expand the company / add a new business to do X?" 
    - Team Reorganization / Merger: "Can we move team Y to team X?"
    - KPI Management: "Open the KPI dashboard", "Create a KPI for quarterly revenue", "Update our customer satisfaction KPI"
    - Performance Review: "Show me our KPI dashboard for Q3"
    - Strategic Planning: "What are our company goals and how are we tracking against them?"
    - Visual Management: "Open the KPI dashboard" or "Show me the company configuration interface"
`

/**
 * View all teams in the office
 */
export const viewTeams = createTool({
    description: "View all teams in the office",
    args: z.object({}),
    handler: async (ctx, args, { toolCallId }) => {
        if (!ctx.userId) throw new Error("User ID is required");
        const teams = await ctx.runQuery(internal.teams.getTeams, { userId: ctx.userId as Id<"users"> });
        return teams;
    },
});

/**
 * Design a new team for the office, it just creates a placeholder team, along with the roles.
 * HR will be responsible for hiring / creating the individual employees and assigning them to the team.
 */
export const designTeam = createTool({
    description: "Design a new team for the office",
    args: z.object({
        name: z.string().describe("The name of the team"),
        description: z.string().describe("The description of the team"),
    }),
    handler: async (ctx, args, { toolCallId }) => {
        if (!ctx.userId) throw new Error("User ID is required");
        // This will be implemented later - for now just create a placeholder team
        return { message: "Team design feature coming soon", teamName: args.name };
    },
});

/**
 * Get company details
 */
export const getCompanyDetails = createTool({
    description: "Get the company details including vision, mission, values, and goals",
    args: z.object({
        fetchTeam: z.boolean().optional().describe("Whether to fetch the team details"),
    }),
    handler: async (ctx, args, { toolCallId }) => {
        if (!ctx.userId) throw new Error("User ID is required");
        const company = await ctx.runQuery(api.companies.getCompany, {
            userId: ctx.userId as Id<"users">,
            fetchTeam: args.fetchTeam,
        });

        if (!company) {
            return { message: "No company found. Please create a company first." };
        }

        return {
            message: "Company details retrieved successfully",
            company
        };
    },
});

/**
 * Update company details
 */
export const updateCompanyDetails = createTool({
    description: "Update company details such as name, vision, mission, values, or goals",
    args: z.object({
        name: z.string().optional().describe("The company name"),
        vision: z.string().optional().describe("The company vision"),
        mission: z.string().optional().describe("The company mission"),
        values: z.array(z.string()).optional().describe("The company values"),
        goals: z.array(z.string()).optional().describe("The company goals"),
    }),
    handler: async (ctx, args, { toolCallId }) => {
        if (!ctx.userId) throw new Error("User ID is required");

        try {
            await ctx.runMutation(api.companies.updateCompany, {
                userId: ctx.userId as Id<"users">,
                name: args.name,
                vision: args.vision,
                mission: args.mission,
                values: args.values,
                goals: args.goals,
            });

            return {
                message: "Company details updated successfully",
                updates: args
            };
        } catch (error) {
            return {
                message: "Failed to update company details",
                error: error instanceof Error ? error.message : "Unknown error"
            };
        }
    },
});

/**
 * Factory function to create CEO tools with proper context injection
 */
export const createCEOTools = async (ctx: ActionCtx, userId: Id<"users">) => {
    // Resolve company scope for KPI tools
    const companyScope = await resolveCompanyScope(ctx, userId);
    const kpiTools = createKPIToolset(ctx, companyScope, userId);
    const openOfficeMicroAppTool = createOpenOfficeMicroAppTool(companyScope);

    return {
        // Company management tools
        viewTeams,
        designTeam,
        getCompanyDetails,
        updateCompanyDetails,

        // Micro-app tools
        openOfficeMicroApp: openOfficeMicroAppTool,

        // KPI tools with company context injected
        viewKPIDashboard: kpiTools.viewKPIDashboard,
        createKPI: kpiTools.createKPI,
        updateKPI: kpiTools.updateKPI,
        removeKPI: kpiTools.removeKPI,
        listKPIs: kpiTools.listKPIs,
    };
};