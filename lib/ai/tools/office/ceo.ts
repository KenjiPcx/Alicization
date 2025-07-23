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
import { resolveCompanyScope, resolveKPIToolset } from "../advanced/kpi";
import { createOpenOfficeMicroAppTool } from "../advanced/office-micro-app";
import { ResolveToolProps, withToolErrorHandling } from "@/lib/ai/tool-utils";
import { resolveAdvancedTools } from "../advanced";
import { Company, Team } from "@/lib/types";
import { tool } from "ai";

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
export const viewTeams = ({
    ctx,
    companyId,
}: ResolveToolProps) => tool({
    description: "View all teams in the office",
    parameters: z.object({}),
    execute: async (args, { toolCallId }): Promise<{
        success: boolean;
        message: string;
        teams?: Team[];
    }> => {
        return withToolErrorHandling(
            async () => {
                const teams = await ctx.runQuery(internal.teams.getTeams, { companyId });
                return { teams };
            },
            {
                operation: "Team listing",
                includeTechnicalDetails: true
            },
            (result) => ({
                message: `Found ${result.teams.length} teams in the office`,
                teams: result.teams
            })
        );
    },
});

/**
 * Design and create a new team for the office with placeholder employees.
 * 
 * USAGE GUIDE FOR CEO:
 * This tool helps you collaboratively design teams with users based on business needs.
 * 
 * CONVERSATION FLOW:
 * 1. User mentions a business problem or need for a team
 * 2. You engage them in discussion to understand:
 *    - What specific business problem are we solving?
 *    - What skills/roles would be needed?
 *    - How many people should be on this team?
 *    - What would success look like?
 * 3. Based on the conversation, propose a team structure
 * 4. Get user feedback and refine the proposal
 * 5. Use this tool to create the actual team and placeholder employees
 * 
 * EXAMPLE CONVERSATION:
 * User: "We need to improve our customer support"
 * You: "Let's design a team for that! Tell me more about the current pain points. How many customers are we serving? What's our response time goal?"
 * User: "We have 1000+ customers, want <2hr response time, need both technical and general support"
 * You: "Perfect! I'm thinking: 1 Customer Success Manager, 2 Support Specialists, 1 Technical Support Lead. Should I create this team?"
 * User: "Yes, but add a part-time data analyst to track metrics"
 * You: "Great idea! Creating the team now..." [calls tool]
 */
export const resolveCreateTeamTool = ({
    ctx,
    userId,
    companyId,
}: ResolveToolProps) => tool({
    description: "Create a new team for the office, this should only be called after the user has specified a business problem, asking you to design a team and you both have agreed to the team design",
    parameters: z.object({
        name: z.string().describe("The name of the team"),
        description: z.string().describe("The description of the team"),
        employees: z.array(z.object({
            jobTitle: z.string().describe("The job title of the employee"),
            jobDescription: z.string().describe("The job description of the employee"),
        })).describe("The employees to create for the team"),
    }),
    execute: async (args, { toolCallId }): Promise<{
        success: boolean;
        message: string;
        teamName?: string;
    }> => {
        return withToolErrorHandling(
            async () => {
                // Create the team
                const teamId = await ctx.runMutation(internal.teams.createTeam, {
                    name: args.name,
                    description: args.description,
                    userId: userId,
                    deskCount: args.employees.length,
                    companyId: companyId,
                });

                // Create the employees
                for (let i = 0; i < args.employees.length; i++) {
                    const employee = args.employees[i];
                    await ctx.runMutation(internal.employees.createEmployee, {
                        jobTitle: employee.jobTitle,
                        jobDescription: employee.jobDescription,
                        userId: userId,
                        teamId: teamId,
                        gender: "male",
                        isSupervisor: false,
                        isCEO: false,
                        deskIndex: i,
                        companyId: companyId,
                    });
                }

                // Add task for user to go to HR to configure agents

                return { teamName: args.name, description: args.description };
            },
            {
                operation: "Create team",
                includeTechnicalDetails: true
            },
            (result) => ({
                message: "Team created successfully",
                teamName: result.teamName,
                description: result.description
            })
        );
    },
});

/**
 * Get company details
 */
export const getCompanyDetails = ({
    ctx,
    userId,
    companyId,
}: ResolveToolProps) => tool({
    description: "Get the company details including vision, mission, values, and goals",
    parameters: z.object({}),
    execute: async (args, { toolCallId }): Promise<{
        success: boolean;
        message: string;
        company?: Company | null;
        teams?: Team[];
    }> => {
        return withToolErrorHandling(
            async () => {
                const companyData = await ctx.runQuery(internal.companies.internalGetCompany, { userId, fetchTeam: true, fetchEmployees: true });
                const { company, teams } = companyData;

                return { company, teams };
            },
            {
                operation: "Company details retrieval",
                includeTechnicalDetails: true
            },
            (result) => ({
                message: "Company details retrieved successfully",
                ...result
            })
        );
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
    handler: async (ctx, args, { toolCallId }): Promise<{
        success: boolean;
        message: string;
        updates?: Partial<Company>;
    }> => {
        return withToolErrorHandling(
            async () => {
                if (!ctx.userId) throw new Error("User ID is required");

                await ctx.runMutation(api.companies.updateCompany, {
                    userId: ctx.userId as Id<"users">,
                    name: args.name,
                    vision: args.vision,
                    mission: args.mission,
                    values: args.values,
                    goals: args.goals,
                });

                return { updates: args };
            },
            {
                operation: "Company details update",
                includeTechnicalDetails: true
            },
            (result) => ({
                message: "Company details updated successfully",
                updates: result.updates
            })
        );
    },
});

/**
 * Factory function to create CEO tools with proper context injection
 */
export const resolveCEOTools = async (toolProps: ResolveToolProps) => {
    // Resolve company scope for KPI tools
    const companyScope = await resolveCompanyScope(toolProps);
    const kpiTools = resolveKPIToolset(toolProps.ctx, companyScope);
    const openOfficeMicroAppTool = createOpenOfficeMicroAppTool({
        kpiScopeAndId: companyScope,
        role: "ceo"
    });
    const advancedTools = resolveAdvancedTools(toolProps);

    return {
        // Advanced tools
        ...advancedTools,

        // Company management tools
        viewTeams,
        createTeam: resolveCreateTeamTool(toolProps),
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