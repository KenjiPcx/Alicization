import { ActionCtx } from "@/convex/_generated/server";
import { Id } from "@/convex/_generated/dataModel";
import { resolveAdvancedTools } from "../advanced";
import { resolveBaseTools } from "../base";
import { createOpenOfficeMicroAppTool } from "../advanced/office-micro-app";
import { ResolveToolProps } from "../../tool-utils";

export const resolveEmployeeTools = (toolProps: ResolveToolProps) => {
    const openOfficeMicroApp = createOpenOfficeMicroAppTool({
        kpiScopeAndId: {
            scope: "employee",
            employeeId: toolProps.employeeId,
        },
        role: "employee"
    });
    const baseTools = resolveBaseTools(toolProps);
    const advancedTools = resolveAdvancedTools(toolProps);

    return {
        ...baseTools,
        ...advancedTools,

        openOfficeMicroApp,
    }
}