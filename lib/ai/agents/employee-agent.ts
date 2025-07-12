
import { Agent, type UsageHandler } from "@convex-dev/agent";
import { components, internal } from "@/convex/_generated/api";
import dedent from "dedent";
import type { FullEmployee } from "../../types";
import { anthropicProviderOptions, embeddingModel, model } from "../model";
import { useMemoryToolsPrompt } from "../tools/advanced/memory";
import { usePlannerToolsPrompt } from "../tools/advanced/planner";


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

export const employeeAgent = new Agent(components.agent, {
    name: "Employee Agent",
    chat: model,
    instructions: // Will override the instructions when performing the actual task
        "You are a helpful AI assistant. Respond concisely and accurately to user questions.",
    tools: {}, // Populated in runtime
    textEmbedding: embeddingModel,
    usageHandler,
});