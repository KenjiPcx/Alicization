import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../../../_generated/api";
import { model } from "../../model";
import dedent from "dedent";
import { generateObject } from "ai";

type WebSearchResult = {
    answer: string,
    source: string
}

// Short term research, just a quick google search tool
export const webSearch = createTool({
    description: "Search the web",
    args: z.object({
        query: z.string().describe("The query to search"),
    }),
    handler: async (ctx, args, { toolCallId }): Promise<WebSearchResult[]> => {
        const { query } = args;

        if (!ctx.threadId) throw new Error("Thread ID is required");
        if (!ctx.messageId) throw new Error("Message ID is required");

        // Create a tool status
        const toolCallStatusId = await ctx.runMutation(internal.toolCallStatuses.createToolCallStatus, {
            toolCallId,
            messageId: ctx.messageId,
            toolName: "webSearch",
            toolParameters: args,
            threadId: ctx.threadId,
        });

        await ctx.runMutation(internal.toolCallStatuses.updateToolCallStatus, {
            toolCallStatusId,
            status: "running",
            message: "Searching the web...",
            progress: 25,
        });

        const res = await ctx.runAction(internal.nodeSearch.search, {
            query,
        });

        await ctx.runMutation(internal.toolCallStatuses.updateToolCallStatus, {
            toolCallStatusId,
            status: "running",
            message: "Extracting information from the web...",
            progress: 50,
        });

        const extracted = await ctx.runAction(internal.nodeSearch.extract, {
            urls: res.results.map((r) => r.url),
        });

        await ctx.runMutation(internal.toolCallStatuses.updateToolCallStatus, {
            toolCallStatusId,
            status: "running",
            message: "Extracting information from the web...",
            progress: 75,
        });

        const { object: usefulInfo } = await generateObject({
            model,
            prompt: dedent(`You are a helpful research assistant that extracts information from web pages.

            Given page content of potentially relevant websites, extract the information that is most relevant to the question: ${query}.
            If there is no relevant information, return an empty array.

            Here is the text: 
            ${JSON.stringify(extracted)}

            Extract the information from the text and return it in a structured format.`),
            output: 'array',
            schema: z.object({
                answer: z.string(),
                source: z.string(),
            }),
        });

        await ctx.runMutation(internal.toolCallStatuses.updateToolCallStatus, {
            toolCallStatusId,
            status: "completed",
            message: "Web search completed",
            progress: 100,
        });

        return usefulInfo;
    },
})

// Longer term research, could link to a workflow that has a more structured approach to research
// Could link to a workflow that has a more structured approach to research
export const webDeepResearch = createTool({
    description: "Research the web",
    args: z.object({
        query: z.string().describe("The query to research"),
    }),
    handler: async (ctx, args): Promise<string> => {
        // Research the web
        // TODO: Build out a workflow that can handle this
        return "Scheduled ";
    },
})