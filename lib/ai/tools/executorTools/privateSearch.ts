"use node"

// Private knowledge can contain internal company documentation, company information, etc.

import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../../../_generated/api";

// A subagent will handle the different needs
export const privateKnowledgeSearch = createTool({
    description: "Search your private knowledge base",
    args: z.object({
        query: z.string().describe("The query to search"),
    }),
    handler: async (ctx, args): Promise<Array<{
        id: string;
        text: string;
        metadata: string;
        score: number;
    }>> => {
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

        return cleanedResults;
    },
})
