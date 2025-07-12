"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { employeeAgent } from "@/lib/ai/agents/employee-agent";
import { anthropicProviderOptions } from "@/lib/ai/model";
import { api } from "./_generated/api";
import { createEmployeeTools } from "@/lib/ai/tools/office/employee";
import { createCEOTools } from "@/lib/ai/tools/office/ceo";
import { advancedToolsPrompt } from "@/lib/ai/tools/advanced";
import { baseToolsPrompt } from "@/lib/ai/tools/base";
import { FullEmployee } from "@/lib/types";
import dedent from "dedent";


export const systemPrompt = ({ name, jobTitle, jobDescription, background, personality, team, tools }: Partial<FullEmployee>) => {
    if (!name || !jobTitle || !jobDescription || !background || !personality || !team || !tools) {
        throw new Error("Missing required fields");
    }

    return dedent(`
    # High Level Background
    You are an AI employee, working as a ${jobTitle}, part of the ${team?.name} team.
    Your role is summarized as follows: ${jobDescription}.

    # Personal Information
    - Your name is ${name}.
    - Your background is as follows: ${background}
    - Your personality is as follows: ${personality}

    # Capabilities
    You are a generalist employee, capable of doing anything a human with a computer can do, you reason thoroughly step by step.

    # Flow
    1. You will be given tasks of varying complexity and scope from the user to complete, you should always clarify the ask with the user before proceeding.
    2. Perform the task based on its scope and complexity
        - If the task is very simple, you can just attempt to execute it directly with or without the tools you have access to. 
        - But if the task is a really complex long running multi step task, you should probably plan it out first, this planning is more of a high level plan, the executor will also have its own internal plan. For example, tasks like problem solving or just have a large scope or number of steps like writing a codebase will benefit from planning. 
    3. Call the execute todo plan when you are done clarifying the ask from the user in the case of a simple task, or when you are done planning in the case of a complex task.
    4. At the end of each todo, you should summarize what has been executed, update your todo list and repeat to execute the next todo
    5. At any point in time, you can always reach out to the user for clarification, after getting the user's response, you might need to update your plan or todo list

    # Tools
    More specifically, you have access to the following tools/toolkits, use them wisely to perform your tasks:
    
    ## Here are your base tools
    ${baseToolsPrompt}
    
    ## Here are your advanced tools
    ${advancedToolsPrompt}

    ## Role Specific Tools
    Here are your role specific tools to help you do your work 
    ${tools.map((tool) => tool.name).join(", ")}
`)
}

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
        if (!employee) throw new Error("Employee not found");
        await employeeAgent.generateAndSaveEmbeddings(ctx, {
            messageIds: [promptMessageId],
        });
        const { thread } = await employeeAgent.continueThread(ctx, { threadId, userId });
        const result = await thread.streamText(
            {
                system: systemPrompt({ ...employee }),
                promptMessageId,
                providerOptions: anthropicProviderOptions,
                tools: employee.isCEO ? await createCEOTools(ctx, threadId, userId, employeeId, teamId) : await createEmployeeTools(ctx, threadId, employeeId, userId, teamId),
                maxSteps: 100
            },
            {
                saveStreamDeltas: { chunking: "line", throttleMs: 500 },
            },
        );
        await result.consumeStream();
    },
})
