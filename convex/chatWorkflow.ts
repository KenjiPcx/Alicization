import { WorkflowManager } from "@convex-dev/workflow";
import { components, internal } from "./_generated/api";
import { v } from "convex/values";
import { employeeAgent } from "@/lib/ai/agents/employee-agent";

export const workflow = new WorkflowManager(components.workflow);

export const chatWorkflow = workflow.define({
    args: {
        threadId: v.string(),
        userId: v.id("users"),
        employeeId: v.id("employees"),
        teamId: v.id("teams"),
    },
    handler: async (step, args) => {
        const { threadId, userId, employeeId, teamId } = args;

        // Generate first tool call

        // While tool call is not empty, execute the tools

        // Feed them back to the agent

        // Summarize the conversation
    },
});
