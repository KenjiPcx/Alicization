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

export const useMemoryToolsPrompt = dedent`
    **Memory Tools:**
    - setMemory: Save facts with descriptive keys. Scopes: personal (private), team (shared), conversation (chat), user (global preferences)
    - searchMemories: Find memories using natural language queries (semantic search)
    
    **Usage:** Save key details immediately, search before asking users to repeat info, use consistent naming (client_name_topic)
`

export const createMemoryTools = (
    ctx: ActionCtx,
    threadId: string,
    userId: Id<"users">,
    employeeId: Id<"employees">,
    teamId?: Id<"teams">
) => {
    return {
        setMemory: tool({
            description: "Save memory and important facts and knowledge from the conversation. Scope determines sharing: personal (private) for stuff like gossip, team (team-wide) for team knowledge, conversation (chat participants) for shared context, user (global preferences) for user preferences.",
            parameters: z.object({
                key: z.string().describe("Clear, descriptive key for the memory"),
                value: z.string().describe("The information to save"),
                scope: z.enum(["personal", "team", "conversation", "user"]).describe("Memory scope - determines who can access it"),
            }),
            execute: async ({ key, value, scope }): Promise<string> => {
                const result = await ctx.runMutation(internal.memories.setMemory, {
                    key,
                    value,
                    scope,
                    threadId,
                    userId,
                    employeeId,
                    teamId,
                });

                return `Saved ${scope} memory: ${key}`;
            },
        }),
        searchMemories: tool({
            description: "Search memories with automatic context detection. Only returns memories you have access to based on the current conversation context.",
            parameters: z.object({
                query: z.string().describe("Search query for text matching"),
                key: z.optional(z.string().describe("Exact key to search for")),
                scope: z.optional(z.enum(["personal", "team", "conversation", "user"]).describe("Filter by memory scope")),
                limit: z.optional(z.number().describe("Maximum number of results (default: 10)")),
            }),
            execute: async ({ query, key, scope, limit = 10 }): Promise<string> => {
                const memories = await ctx.runAction(internal.memories.searchMemories, {
                    query,
                    threadId,
                    userId,
                    employeeId,
                    teamId,
                    scope,
                    limit,
                });

                if (memories.length === 0) {
                    return query ? `No memories found for query: "${query}"` : "No memories found matching your criteria";
                }

                const results = memories.map((m: any) =>
                    `${m.key}: ${m.value} (${m.scope})`
                ).join('\n');

                return `Found ${memories.length} memories:\n${results}`;
            },
        }),
    }
}