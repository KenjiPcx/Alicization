import { z } from "zod";
import { tool } from "ai";
import { type ScopeAndId } from "@/lib/types";

/**
 * Creates a tool that lets the agent open up a micro app for viewing and interacting with specific data dashboards
 * @param scopeAndId - The scope and ID of the data dashboard to open
 * @returns 
 */
export const createOpenOfficeMicroAppTool = (
    scopeAndId: ScopeAndId
) => tool({
    description: "Open a micro app for viewing and interacting with specific data dashboards",
    parameters: z.object({
        name: z.enum(["kpi-dashboard", "company-config", "employee-config"]),
        title: z.string().optional().describe("Custom title for the micro app"),
    }),
    execute: async (args) => {
        const { name, title } = args;

        // Create a micro-app artifact entry
        const microAppTitle = title || {
            "kpi-dashboard": "KPI Dashboard",
            "company-config": "Company Configuration",
            "employee-config": "Employee Configuration"
        }[name];

        return {
            message: `Opening ${microAppTitle} micro app`,
            microAppType: name,
            ...scopeAndId,
        };
    },
})