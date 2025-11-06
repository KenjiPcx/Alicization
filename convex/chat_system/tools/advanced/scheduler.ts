// Schedule a task to be executed later
// Could be a cron job, a delayed task, a background task, etc.

import { createTool } from "@convex-dev/agent";
import { z } from "zod";

export const scheduleTask = createTool({
    description: "Schedule a task",
    args: z.object({
        task: z.string().describe("The task to schedule"),
    }),
    handler: async (): Promise<string> => {
        // Schedule a task
        return "Task scheduled";
    },
})

