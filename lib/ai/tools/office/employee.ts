import { ActionCtx } from "@/convex/_generated/server";
import { Id } from "@/convex/_generated/dataModel";
import { createAdvancedTools } from "../advanced";
import { baseTools } from "../base";
import { createOpenOfficeMicroAppTool } from "../advanced/office-micro-app";

export const createEmployeeTools = (ctx: ActionCtx, threadId: string, employeeId: Id<"employees">, userId: Id<"users">, teamId: Id<"teams">) => {
    const openOfficeMicroApp = createOpenOfficeMicroAppTool({
        kpiScopeAndId: {
            scope: "employee",
            employeeId
        },
        role: "employee"
    });
    const advancedTools = createAdvancedTools(ctx, threadId, userId, employeeId, teamId);

    return {
        ...baseTools,
        ...advancedTools,

        openOfficeMicroApp,
    }
}