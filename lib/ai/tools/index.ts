import { ActionCtx } from "@/convex/_generated/server";
import { createAdvancedTools } from "./advanced";
import { Id } from "@/convex/_generated/dataModel";

export const createEmployeeTools = (
    ctx: ActionCtx,
    threadId: string,
    userId: Id<"users">,
    employeeId: Id<"employees">,
    teamId?: Id<"teams">
) => {
    return {
        ...createAdvancedTools(ctx, threadId, userId, employeeId, teamId),
    }
}