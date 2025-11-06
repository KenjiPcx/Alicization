import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "@/convex/_generated/api";
import dedent from "dedent";

export const useInterpreterPrompt = dedent`
    <Use Interpreter Docs>
    The interpreter is a lightweight python interpreter environment for codeAct. It unfortunately does not have access to the internet or filesystem.
    You can use it to execute python code directly. Python can be used to handle lots of general scripting tasks like creating charts, calculating stats with pandas, etc.
    </Use Interpreter Docs>
`

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

        const execution = await ctx.runAction(internal.interpreter.e2bInterpreter, {
            threadId,
            code,
        });
        return `Interpreter used: \n${JSON.stringify(execution, null, 2)}`;
    },
})
