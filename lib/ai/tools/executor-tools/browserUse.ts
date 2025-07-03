"use node"

// TODO: Implement this with browserbase or something

import { createTool } from "@convex-dev/agent";
import { z } from "zod";

// A browser tool to execute browser related tasks that can't be done with the interpreter or any other tools
// Filling up a form, booking a hotel, etc.
export const useBrowser = createTool({
    description: "Use the browser",
    args: z.object({
        content: z.string().describe("The content to use the browser"),
    }),
    handler: async (ctx, args): Promise<string> => {
        // Use the browser
        return "Browser used";
    },
})
