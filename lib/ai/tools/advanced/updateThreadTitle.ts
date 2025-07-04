import { components } from "@/convex/_generated/api";
import { createTool } from "@convex-dev/agent";
import { z } from "zod";

export const updateThreadTitle = createTool({
    args: z.object({
        title: z.string().describe("The new title for the thread"),
    }),
    description:
        "Update the title of the current thread. It will respond with 'updated' if it succeeded",
    handler: async (ctx, args) => {
        if (!ctx.threadId) {
            console.warn("updateThreadTitle called without a threadId");
            return "skipped";
        }
        await ctx.runMutation(components.agent.threads.updateThread, {
            threadId: ctx.threadId,
            patch: { title: args.title },
        });
        return "updated";
    },
});
