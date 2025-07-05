import { updateThreadTitle } from "./updateThreadTitle";
import { raiseMissingToolRequest } from "./feedback";
import { createChat } from "./agent-collab";
import { scheduleTask } from "./scheduler";
import { createMemoryTools } from "./memory";
import { plannerTools } from "./planner";
import { Id } from "@/convex/_generated/dataModel";
import { ActionCtx } from "@/convex/_generated/server";

export const advancedTools = {
    // scheduleTask,
    // createChat,
    // raiseMissingToolRequest,
    // updateThreadTitle,
}

export const createAdvancedTools = (
    ctx: ActionCtx,
    threadId: string,
    userId: Id<"users">,
    employeeId: Id<"employees">,
    teamId?: Id<"teams">
) => {
    return {
        ...advancedTools,
        ...plannerTools,
        ...createMemoryTools(ctx, threadId, userId, employeeId, teamId),
    }
}