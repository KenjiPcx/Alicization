// import { z } from "zod";
// import { tool } from "ai";
// import { type ScopeAndId } from "@/lib/types";
// import { Doc } from "@/convex/_generated/dataModel";

// interface OpenOfficeMicroAppToolProps {
//     kpiScopeAndId: ScopeAndId;
//     role?: Doc<"employees">["builtInRole"];
// }

// /**
//  * Returns the available micro apps for a given role
//  * @param role - The role of the employee
//  * @returns The available micro apps for the given role
//  */
// export const getAvailableApps = (role?: Doc<"employees">["builtInRole"]) => {
//     switch (role) {
//         case "ceo":
//             return ["kpi-dashboard", "company-config", "employee-config", "employee-drive", "company-toolset-config", "employee-directory-config"] as const;
//         case "cto":
//             return ["kpi-dashboard", "employee-config", "employee-drive", "company-toolset-config"] as const;
//         case "cmo":
//             return ["kpi-dashboard", "employee-config", "employee-drive", "company-toolset-config"] as const;
//         case "cso":
//             return ["kpi-dashboard", "employee-config", "employee-drive", "company-toolset-config"] as const;
//         case "chro":
//             return ["kpi-dashboard", "employee-config", "employee-drive", "employee-directory-config"] as const;
//         case "cfo":
//             return ["kpi-dashboard", "employee-config", "employee-drive"] as const;
//         case "coo":
//             return ["kpi-dashboard", "employee-config", "employee-drive"] as const;
//         default: // employee
//             return ["kpi-dashboard", "employee-config", "employee-drive"] as const;
//     }
// };

// /**
//  * Creates a tool that lets the agent open up a micro app for viewing and interacting with specific data dashboards
//  * @param kpiScopeAndId - The scope and ID of the data dashboard to open
//  * @returns 
//  */
// export const createOpenOfficeMicroAppTool = ({ kpiScopeAndId, role }: OpenOfficeMicroAppToolProps) => {
//     const availableApps = getAvailableApps(role);

//     return tool({
//         description: "Open a micro app for viewing and interacting with specific data dashboards",
//         parameters: z.object({
//             name: z.enum(availableApps),
//             title: z.string().optional().describe("Custom title for the micro app"),
//         }),
//         execute: async (args) => {
//             const { name, title } = args;

//             // Create a micro-app artifact entry
//             const microAppTitle = title || {
//                 "kpi-dashboard": "KPI Dashboard",
//                 "company-config": "Company Configuration",
//                 "employee-config": "Employee Configuration",
//                 "employee-drive": "Employee Drive",
//                 "company-toolset-config": "Company Toolset Configuration",
//                 "employee-directory-config": "HR Employee Management"
//             }[name];

//             return {
//                 message: `Opening ${microAppTitle} micro app`,
//                 microAppType: name,
//                 ...kpiScopeAndId,
//             };
//         },
//     });
// }