import { createTool } from "@convex-dev/agent";
import z from "zod";

// Create a chat with other agents in the office
export const createChat = createTool({
    description: "Create a chat",
    args: z.object({
        title: z.string().describe("The title of the chat"),
    }),
    handler: async (ctx, args): Promise<string> => {
        // Create a chat
        return "Chat created";
    },
})
