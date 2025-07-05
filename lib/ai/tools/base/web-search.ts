import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { model } from "../../model";
import dedent from "dedent";
import { generateObject } from "ai";
import { internal } from "@/convex/_generated/api";
import { tavily } from "@tavily/core"

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
    handler: async (ctx, args, { toolCallId }): Promise<z.infer<typeof webSearchResultSchema>[]> => {
        const { query, topic, timeRange, includeDomains, excludeDomains } = args;

        if (!ctx.threadId) throw new Error("Thread ID is required");
        if (!ctx.messageId) throw new Error("Message ID is required");

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
                max_results: 8,
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
                model,
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

            return usefulInfo;
        } catch (error) {
            if (error instanceof Error) {
                await ctx.runMutation(internal.backgroundJobStatuses.updateBackgroundJobStatus, {
                    backgroundJobStatusId,
                    status: "failed",
                    message: `Search failed: ${error.message}`,
                    progress: 0,
                });

                throw new Error(`Web search failed: ${error.message}`);
            }
            throw new Error("An unknown error occurred");
        }
    },
})