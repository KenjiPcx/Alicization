import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { summaryModel } from "../../model";
import dedent from "dedent";
import { generateObject } from "ai";
import { internal } from "@/convex/_generated/api";
import { tavily } from "@tavily/core";
import { withToolErrorHandling } from "@/lib/ai/tool-utils";

export const useWebSearchPrompt = dedent`
    <Use Web Search Docs>
    The web search tool is a tool that allows you to search the web for information.
    If the tool fails, try calling it again at most 3 times.
    </Use Web Search Docs>
`

const webSearchResultSchema = z.object({
    content: z.string(),
    sourceUrl: z.string(),
})

const tvly = tavily({
    apiKey: process.env.TAVILY_API_KEY,
})

const queryFieldDescription = dedent`
    The search query to execute.

    **Guidelines:**
    - Keep queries under 400 characters
    - Use specific, focused terms rather than broad concepts
    - Break complex topics into separate, targeted searches

    **Instead of:** "Complete analysis of company ABC including history, financials, competitors, and market trends"

    **Use multiple focused queries:**
    - "Company ABC financial performance 2024"
    - "ABC competitors market analysis" 
    - "ABC recent news developments"
    - "Industry trends affecting ABC"

    **Tips:**
    - Include specific years, locations, or metrics when relevant
    - Use company names, product names, or technical terms for precision
    - Consider different angles: news, analysis, reports, statistics
`

// Short term research, just a quick web search tool
export const webSearch = createTool({
    description: "Search the web for information",
    args: z.object({
        query: z.string().describe(queryFieldDescription),
        topic: z.enum(["general", "news", "finance"]).describe("The scope of the search").default("general"),
        timeRange: z.optional(z.enum(["year", "month", "week", "day"])).describe("Filter results by recent time range, leave it out if you need results from all time"),
        includeDomains: z.optional(z.array(z.string())).describe("Filter results by specific domains, leave it out if you need results from all domains"),
        excludeDomains: z.optional(z.array(z.string())).describe("Exclude specific domains, leave it out if you need results from all domains")
    }),
    handler: async (ctx, args, { toolCallId }): Promise<{
        success: boolean;
        message: string;
        results?: z.infer<typeof webSearchResultSchema>[];
        query?: string;
        resultCount?: number;
    }> => {
        return withToolErrorHandling(
            async () => {
                if (!ctx.threadId) throw new Error("Thread ID is required");
                if (!ctx.messageId) throw new Error("Message ID is required");

                const { query, topic, timeRange, includeDomains, excludeDomains } = args;

                // Create a tool status
                const backgroundJobStatusId = await ctx.runMutation(internal.backgroundJobStatuses.createBackgroundJobStatus, {
                    toolCallId,
                    messageId: ctx.messageId,
                    toolName: "webSearch",
                    toolParameters: args,
                    threadId: ctx.threadId,
                });

                try {
                    await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
                        backgroundJobStatusId,
                        status: "running",
                        message: "Searching the web...",
                        progress: 25,
                    });

                    const res = await tvly.search(query, {
                        max_results: 5,
                        topic: topic,
                        searchDepth: "advanced",
                        timeRange: timeRange,
                        includeDomains: includeDomains,
                        excludeDomains: excludeDomains
                    })

                    await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
                        backgroundJobStatusId,
                        status: "running",
                        message: `Found ${res.results.length} results, analyzing content...`,
                        progress: 60,
                    });

                    const extracted = await tvly.extract(res.results.map((r) => r.url))

                    await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
                        backgroundJobStatusId,
                        status: "running",
                        message: "Extracting information from the web...",
                        progress: 75,
                    });

                    const { object: usefulInfo } = await generateObject({
                        model: summaryModel,
                        prompt: dedent(`You are a helpful research assistant that extracts information from web pages.

                        Given page content of potentially relevant websites, extract the information that is most relevant to the question: ${query}.
                        If there is no relevant information, return an empty array.

                        Here is the text: 
                        ${JSON.stringify(extracted)}

                        Extract the information from the text and return it in a structured format.`),
                        output: 'array',
                        schema: webSearchResultSchema,
                    });

                    await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
                        backgroundJobStatusId,
                        status: "completed",
                        message: `Search completed: ${usefulInfo.length} relevant results found`,
                        progress: 100,
                    });

                    return {
                        results: usefulInfo,
                        query,
                        resultCount: usefulInfo.length,
                        backgroundJobStatusId
                    };
                } catch (error) {
                    await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
                        backgroundJobStatusId,
                        status: "failed",
                        message: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        progress: 0,
                    });
                    throw error; // Re-throw to be handled by withToolErrorHandling
                }
            },
            {
                operation: "Web search",
                context: `query: "${args.query}"`,
                includeTechnicalDetails: true
            },
            ({ results, query, resultCount }) => ({
                message: `Web search completed successfully for "${query}". Found ${resultCount} relevant results.`,
                results: results,
                query: query,
                resultCount: resultCount
            })
        );
    },
})