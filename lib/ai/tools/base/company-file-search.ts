// Private knowledge can contain internal company documentation, company information, etc.

import { z } from "zod";
import { ResolveToolProps, withToolErrorHandling } from "@/lib/ai/tool-utils";
import dedent from "dedent";
import { rag } from "@/convex/setup";
import { SearchResult } from "@convex-dev/rag";
import { tool } from "ai";

export const useCompanyFileSearchPrompt = dedent`
    <Use Company File Search Docs>
    The company file search tool is a tool that allows you to search your company file base.
    It can search for company documentation, company data and other company information.
    </Use Company File Search Docs>
`

export type PrivateKnowledgeSearchResult = {
    success: boolean;
    message: string;
    results?: SearchResult[];
    query?: string;
    resultCount?: number;
}

export const resolveCompanyFileSearchTool = ({
    ctx,
    companyId,
}: ResolveToolProps) => tool({
    description: "Search your company file data base",
    parameters: z.object({
        query: z.string().describe("The query to search"),
    }),
    execute: async (args, { toolCallId }) => {
        return withToolErrorHandling(
            async () => {
                const { query } = args;

                // This has both company files - private data and documentation
                const { results, text, entries } = await rag.search(ctx, {
                    namespace: companyId,
                    query: args.query,
                    limit: 5,
                    chunkContext: { before: 1, after: 1 },
                    vectorScoreThreshold: 0.5, // Only return results with a score >= 0.5
                });

                return { results: results, query, resultCount: results.length };
            },
            {
                operation: "Private knowledge search",
                context: `query: "${args.query}"`,
                includeTechnicalDetails: true
            },
            ({ results, query, resultCount }) => ({
                message: `Private knowledge search completed for "${query}". Found ${resultCount} relevant documents.`,
                results,
                query,
                resultCount
            })
        );
    },
})
