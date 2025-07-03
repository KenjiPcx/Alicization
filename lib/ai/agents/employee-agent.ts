
import { Agent, type UsageHandler } from "@convex-dev/agent";
import { components, internal } from "@/convex/_generated/api";
import dedent from "dedent";
import type { FullEmployee } from "../../types";
import { anthropicProviderOptions, embeddingModel, model } from "../model";
// import { executorTools } from "../tools/executorTools/index";
// import { supervisorTools } from "../tools/supervisorTools";


export const systemPrompt = ({ name, jobTitle, jobDescription, background, personality, team, tools }: FullEmployee) => dedent(`
    # High Level Background
    You are an AI employee, working as a ${jobTitle} at ${team.name}.
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
    More specifically, you have access to the following tools, use them wisely to perform your tasks:
    - ${tools.map((tool) => tool.name).join(", ")}
`)

const usageHandler: UsageHandler = async (ctx, args) => {
    const { userId, agentName, model, provider, usage, providerMetadata } = args;
    if (!userId) {
        console.warn("usageHandler called with no userId");
        return;
    }

    await ctx.runMutation(internal.usage.insertRawUsage, {
        userId,
        agentName,
        model,
        provider,
        usage,
        providerMetadata: providerMetadata ?? {},
    });
}

export const executorAgent = new Agent(components.agent, {
    name: "Executor Agent",
    chat: model,
    instructions: "You are an executor agent, you will be given a task to execute, you should execute the task and return the result.",
    // tools: executorTools,
    textEmbedding: embeddingModel,
    usageHandler,
});

// Supervisor Agent
export const employeeAgent = new Agent(components.agent, {
    name: "Employee Agent",
    chat: model,
    instructions: // Will override the instructions when performing the actual task
        "You are a helpful AI assistant. Respond concisely and accurately to user questions.",
    tools: {
        // ...supervisorTools,
        // ...executorTools,
    },
    textEmbedding: embeddingModel,
    usageHandler,
});
