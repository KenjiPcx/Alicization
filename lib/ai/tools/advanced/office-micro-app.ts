import { z } from "zod";
import { tool } from "ai";
import { type ScopeAndId } from "@/lib/types";

interface OpenOfficeMicroAppToolProps {
    kpiScopeAndId: ScopeAndId;
    role: "ceo" | "employee" | "hr";
}

/**
 * Creates a tool that lets the agent open up a micro app for viewing and interacting with specific data dashboards
 * @param kpiScopeAndId - The scope and ID of the data dashboard to open
 * @returns 
 */
export const createOpenOfficeMicroAppTool = ({ kpiScopeAndId, role }: OpenOfficeMicroAppToolProps) => tool({
    description: "Open a micro app for viewing and interacting with specific data dashboards",
    parameters: z.object({
        name: role === "ceo" ? z.enum(["kpi-dashboard", "company-config", "employee-config"]) : z.enum(["kpi-dashboard", "employee-config"]),
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
            ...kpiScopeAndId,
        };
    },
})