import { ActionCtx } from "@/convex/_generated/server";
import { Id } from "@/convex/_generated/dataModel";
import { createAdvancedTools } from "../advanced";
import { baseTools } from "../base";

export const createEmployeeTools = (ctx: ActionCtx, threadId: string, employeeId: Id<"employees">, userId: Id<"users">, teamId: Id<"teams">) => {
    return {
        ...baseTools,
        ...createAdvancedTools(ctx, threadId, userId, employeeId, teamId),
    }
}