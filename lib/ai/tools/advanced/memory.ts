// Unified Office Memory System - Uses dependency injection for context
// setMemory: Save any type of memory with injected context
// searchMemories: Search memories with injected context

/**
 * AGENT MEMORY USAGE GUIDE
 * 
 * Use these tools to remember and recall information across conversations:
 * 
 * 🧠 **setMemory**: Save important facts, preferences, and context
 * - Use clear, descriptive keys (e.g., "client_ABC_preferences", "team_meeting_notes")
 * - Choose the right scope:
 *   • personal: Private info/gossip only you should know
 *   • team: Knowledge your whole team should access
 *   • conversation: Context for this specific chat
 *   • user: Global user preferences and settings
 * 
 * 🔍 **searchMemories**: Find relevant memories using semantic search
 * - Use natural language queries (e.g., "client preferences", "meeting decisions")
 * - Searches by meaning, not just keywords
 * - Automatically filters by what you have access to
 * 
 * 💡 **Best Practices**:
 * - Save key details right when you learn them
 * - Use consistent naming for keys (client_name_topic)
 * - Search before asking users to repeat information
 * - Update memories when information changes
 */

import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { z } from "zod";
import { ActionCtx } from "@/convex/_generated/server";
import { tool } from "ai";
import dedent from "dedent";
import { withToolErrorHandling } from "@/lib/ai/tool-utils";

export const useMemoryToolsPrompt = dedent`
    <Use Memory Tools Docs>
    **Memory Tools:**
    - setMemory: Save facts with descriptive keys. Scopes: personal (private, only information you should know), team (shared, information your team should know), user (global preferences, information everyone should know)
    - searchMemories: Find memories using natural language queries (semantic search)
    
    **Guidelines:**
    - Personal scope would be useful for things like gossip, internal notes, etc.
    - For team scope, take into account what team you are currently on and think how useful this information is for the team.
    - User scope would be useful for things like user preferences, user facts, etc.

    **Usage:** Save key details immediately, search before asking users to repeat info, use consistent naming (client_name_topic)
    </Use Memory Tools Docs>
`

export type SetMemoryResult = {
    success: boolean;
    message: string;
    key: string;
    value: string;
    scope: string;
};

export type SearchMemoryResult = {
    success: boolean;
    message: string;
    memories: {
        key: string;
        value: string;
        scope: string;
    }[];
};

export const createMemoryTools = (
    ctx: ActionCtx,
    threadId: string,
    userId: Id<"users">,
    employeeId: Id<"employees">,
    teamId: Id<"teams">
) => {
    return {
        setMemory: tool({
            description: "Save memory and important facts and knowledge from the conversation. Scope determines sharing: personal (private) for stuff like gossip, team (team-wide) for team knowledge, conversation (chat participants) for shared context, user (global preferences) for user preferences.",
            parameters: z.object({
                key: z.string().describe("Clear, descriptive key for the memory"),
                value: z.string().describe("The information to save"),
                scope: z.enum(["personal", "team", "user"]).describe("Memory scope - determines who can access it"),
            }),
            execute: async ({ key, value, scope }): Promise<SetMemoryResult> => {
                return withToolErrorHandling(
                    async () => {
                        await ctx.runMutation(internal.memories.setMemory, {
                            key,
                            value,
                            scope,
                            threadId,
                            userId,
                            employeeId,
                            teamId,
                        });

                        return { key, value, scope };
                    },
                    {
                        operation: "Memory storage",
                        context: `${scope} scope`,
                        includeTechnicalDetails: true
                    },
                    (result) => ({
                        message: `Saved ${result.scope} memory: ${result.key}`,
                        key: result.key,
                        value: result.value,
                        scope: result.scope
                    })
                );
            },
        }),
        searchMemories: tool({
            description: "Search memories with automatic context detection. Only returns memories you have access to based on the current conversation context.",
            parameters: z.object({
                query: z.string().describe("Search query for text matching"),
                scope: z.optional(z.enum(["personal", "team", "user"]).describe("Filter by memory scope")),
            }),
            execute: async ({ query, scope }): Promise<SearchMemoryResult> => {
                return withToolErrorHandling(
                    async () => {
                        const memories = await ctx.runAction(internal.memories.searchMemories, {
                            query,
                            threadId,
                            userId,
                            employeeId,
                            teamId,
                            scope,
                            limit: 10,
                        });

                        const results = memories.filter(m => m !== null).map((m) => {
                            return {
                                key: m.key,
                                value: m.value,
                                scope: m.scope,
                            }
                        });

                        return { query, memories: results, memoriesCount: memories.length };
                    },
                    {
                        operation: "Memory search",
                        context: scope ? `${scope} scope` : "all scopes",
                        includeTechnicalDetails: true
                    },
                    (result) => {
                        if (result.memoriesCount === 0) {
                            return {
                                message: result.query ? `No memories found for query: "${result.query}"` : "No memories found matching your criteria",
                                memories: [],
                            };
                        }

                        return {
                            message: `Found ${result.memoriesCount}`,
                            memories: result.memories,
                        };
                    }
                );
            },
        }),
    }
}