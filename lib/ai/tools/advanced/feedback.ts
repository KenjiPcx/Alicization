// Let the supervisor know that a tool is missing

import { createTool } from "@convex-dev/agent";
import { z } from "zod";

// More like giving feedback on what is missing to execute a task
export const raiseMissingToolRequest = createTool({
    description: "Raise a tool request, when planning a task, and you feel like you don't have the right tools to execute the task, use this tool to raise a request to the user or the company to add the missing tools",
    args: z.object({
        tool: z.string().describe("The tool to request"),
    }),
    handler: async (ctx, args): Promise<string> => {
        // Raise a tool request
        return "Tool request raised";
    },
})