import { updateThreadTitle } from "./updateThreadTitle";
import { createHumanCollabTool } from "./human-collab";
import { raiseMissingToolRequest } from "./feedback";
import { createChat } from "./agent-collab";
import { scheduleTask } from "./scheduler";
import { createMemoryTools } from "./memory";
import { createPlannerTools } from "./planner";
import { Id } from "@/convex/_generated/dataModel";
import { ActionCtx } from "@/convex/_generated/server";
import dedent from "dedent";
import { usePlannerToolsPrompt } from "./planner";
import { useMemoryToolsPrompt } from "./memory";

export const advancedToolsPrompt = dedent`
    <Use Advanced Tools Docs>
    ${usePlannerToolsPrompt}
    ${useMemoryToolsPrompt}
    </Use Advanced Tools Docs>
`
export const createAdvancedTools = (
    ctx: ActionCtx,
    threadId: string,
    userId: Id<"users">,
    employeeId: Id<"employees">,
    teamId: Id<"teams">
) => {
    return {
        requestHumanInput: createHumanCollabTool(ctx, threadId, teamId, employeeId, userId),
        ...createPlannerTools(ctx, threadId, userId, employeeId, teamId),
        ...createMemoryTools(ctx, threadId, userId, employeeId, teamId),
        updateThreadTitle,
    }
}