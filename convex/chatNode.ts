"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { employeeAgent, systemPrompt } from "@/lib/ai/agents/employee-agent";
import { anthropicProviderOptions } from "@/lib/ai/model";
import { api } from "./_generated/api";
import { createEmployeeTools } from "@/lib/ai/tools/office/employee";

export const streamMessage = internalAction({
    args: {
        threadId: v.string(),
        promptMessageId: v.string(),
        userId: v.id("users"),
        employeeId: v.id("employees"),
        teamId: v.optional(v.id("teams")),
    },
    handler: async (ctx, { promptMessageId, threadId, userId, employeeId, teamId }) => {
        // Resolve employee from employeeId and get employee details
        const employee = await ctx.runQuery(api.employees.getEmployeeById, {
            employeeId,
        });
        await employeeAgent.generateAndSaveEmbeddings(ctx, {
            messageIds: [promptMessageId],
        });
        const { thread } = await employeeAgent.continueThread(ctx, { threadId, userId });
        const result = await thread.streamText(
            {
                system: systemPrompt({ ...employee }),
                promptMessageId,
                providerOptions: anthropicProviderOptions,
                tools: createEmployeeTools(ctx, threadId, employeeId, userId, teamId),
                maxSteps: 20
            },
            {
                saveStreamDeltas: { chunking: "line", throttleMs: 500 },
            },
        );
        await result.consumeStream();
    },
})
