/**
 * Team Lead tools - example of using generalized KPI tools with team scope
 */

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { createTool } from "@convex-dev/agent";
import dedent from "dedent";
import { z } from "zod";
import { createKPIToolset, resolveTeamScope } from "../advanced/kpi";
import { ActionCtx } from "@/convex/_generated/server";

export const useTeamLeadToolsPrompt = dedent`
    # Team Lead Tools
    The Team Lead tools let you manage your team and track team performance:
    - View team members and their roles
    - Manage team-level KPIs and performance metrics
    - Track team goals and progress
    - Create, update, and remove team KPIs

    ## Common Workflows
    - Team Performance: "Show me our team KPI dashboard for Q3"
    - Goal Setting: "Create a KPI for team customer satisfaction"
    - Progress Tracking: "Update our sales target KPI to 150 units"
    - Team Management: "Who's on my team and what are their current tasks?"
`;

/**
 * View team members
 */
export const viewTeamMembers = createTool({
    description: "View all members of your team",
    args: z.object({
        teamId: z.string().describe("The team ID"),
    }),
    handler: async (ctx, args) => {
        if (!ctx.userId) throw new Error("User ID is required");

        const teamMembers = await ctx.runQuery(api.employees.getEmployeesByTeam, {
            teamId: args.teamId as Id<"teams">,
        });

        return {
            message: "Team members retrieved successfully",
            teamMembers: teamMembers.map(member => ({
                name: member.name,
                jobTitle: member.jobTitle,
                status: member.status,
                statusMessage: member.statusMessage,
                isSupervisor: member.isSupervisor,
            }))
        };
    },
});

/**
 * Factory function to create Team Lead tools with proper context injection
 */
export const createTeamLeadTools = async (ctx: ActionCtx, teamId: Id<"teams">, userId: Id<"users">) => {
    // Resolve team scope for KPI tools
    const teamScope = resolveTeamScope(teamId);
    const kpiTools = createKPIToolset(ctx, teamScope);

    return {
        // Team management tools
        viewTeamMembers,

        // KPI tools with team context injected
        viewKPIDashboard: kpiTools.viewKPIDashboard,
        createKPI: kpiTools.createKPI,
        updateKPI: kpiTools.updateKPI,
        removeKPI: kpiTools.removeKPI,
        listKPIs: kpiTools.listKPIs,
    };
}; 