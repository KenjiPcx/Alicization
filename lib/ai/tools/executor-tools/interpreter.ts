import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../../../_generated/api";

// Lightweight python interpreter environment for codeAct
// Useful for executing tasks directly using python as a catch all for any other tool that is not supported
// That is easily achievable with codeAct
export const useInterpreter = createTool({
    description: "Use the interpreter",
    args: z.object({
        code: z
            .string()
            .describe(`Python code that will be directly executed via Jupyter Notebook.
                The stdout, stderr and results will be returned as a JSON object.
                Subsequent calls to the tool will keep the state of the interpreter.`),
    }),
    handler: async (ctx, args): Promise<string> => {
        const { code } = args;
        const threadId = ctx.threadId;
        if (!threadId) {
            throw new Error("Thread ID is required");
        }

        const execution = await ctx.runAction(internal.nodeInterpreter.e2bInterpreter, {
            threadId,
            code,
        });
        return `Interpreter used: \n${JSON.stringify(execution, null, 2)}`;
    },
})
