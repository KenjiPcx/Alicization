"use node"

import { createTool } from "@convex-dev/agent";
import { z } from "zod";

// Users can easily integrate any external MCP servers into the agent, it will automatically use the correct MCP server for the task
export const useMcp = createTool({
    description: "Use the mcp, this is a catch all tool for any external MCP server that is not supported by the agent",
    args: z.object({
        content: z.string().describe("The content to use the mcp"),
    }),
    handler: async (ctx, args): Promise<string> => {
        // Use the mcp
        return "MCP used";
    },
})
