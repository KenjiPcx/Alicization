
import { Agent, type UsageHandler } from "@convex-dev/agent";
import { components, internal } from "@/convex/_generated/api";
import { embeddingModel, model } from "../../../lib/ai/model";


export const employeeAgent = new Agent(components.agent, {
    name: "Employee Agent",
    languageModel: model,
    instructions: // Will override the instructions when performing the actual task
        "You are a helpful AI assistant. Respond concisely and accurately to user questions.",
    tools: {}, // Populated in runtime
});