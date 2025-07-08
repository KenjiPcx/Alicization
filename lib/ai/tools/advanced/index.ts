import { updateThreadTitle } from "./updateThreadTitle";
import { raiseMissingToolRequest } from "./feedback";
import { createChat } from "./agent-collab";
import { scheduleTask } from "./scheduler";
import { createMemoryTools } from "./memory";
import { plannerTools } from "./planner";
import { openMicroApp } from "./micro-app";
import { Id } from "@/convex/_generated/dataModel";
import { ActionCtx } from "@/convex/_generated/server";

export const createAdvancedTools = (
    ctx: ActionCtx,
    threadId: string,
    userId: Id<"users">,
    employeeId: Id<"employees">,
    teamId?: Id<"teams">
) => {
    return {
        openMicroApp,
        ...plannerTools,
        ...createMemoryTools(ctx, threadId, userId, employeeId, teamId),
        updateThreadTitle,
    }
}