// Private knowledge can contain internal company documentation, company information, etc.

import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "@/convex/_generated/api";
import { withToolErrorHandling } from "@/lib/ai/tool-utils";

// A subagent will handle the different needs
export const privateKnowledgeSearch = createTool({
    description: "Search your private knowledge base",
    args: z.object({
        query: z.string().describe("The query to search"),
    }),
    handler: async (ctx, args): Promise<{
        success: boolean;
        message: string;
        results?: Array<{
            id: string;
            text: string;
            metadata: string;
            score: number;
        }>;
        query?: string;
        resultCount?: number;
    }> => {
        return withToolErrorHandling(
            async () => {
                if (!ctx.threadId) throw new Error("Thread ID is required");
                if (!ctx.userId) throw new Error("User ID is required");

                const { query } = args;

                const results = await ctx.runAction(internal.companyFiles.searchCompanyFileEmbeddingChunks, {
                    query,
                });

                const cleanedResults = results.map(result => ({
                    id: result._id,
                    text: result.text,
                    metadata: result.metadata,
                    score: result.score,
                }));

                return { results: cleanedResults, query, resultCount: cleanedResults.length };
            },
            {
                operation: "Private knowledge search",
                context: `query: "${args.query}"`,
                includeTechnicalDetails: true
            },
            ({ results, query, resultCount }) => ({
                message: `Private knowledge search completed for "${query}". Found ${resultCount} relevant documents.`,
                results: results,
                query: query,
                resultCount: resultCount
            })
        );
    },
})
