'use client';

import React from 'react';
import { Search, User, Users, Building, Brain } from "lucide-react";

interface SearchMemoryResult {
    success: boolean;
    message: string;
    memories: {
        key: string;
        value: string;
        scope: string;
    }[];
}

interface MemorySearchPreviewProps {
    args: {
        query?: string;
        scope?: string;
        limit?: number;
    };
    toolCallId: string;
    threadId: string;
    result?: SearchMemoryResult;
}

export function MemorySearchPreview({ args, toolCallId, threadId, result }: MemorySearchPreviewProps) {
    const getScopeIcon = (scope: string) => {
        switch (scope) {
            case 'personal':
                return <User className="w-4 h-4 text-hacker-accent" />;
            case 'team':
                return <Users className="w-4 h-4 text-hacker-accent" />;
            case 'user':
                return <Building className="w-4 h-4 text-hacker-accent" />;
            default:
                return <Brain className="w-4 h-4 text-hacker-accent" />;
        }
    };

    const getScopeLabel = (scope: string) => {
        switch (scope) {
            case 'personal':
                return 'Personal';
            case 'team':
                return 'Team';
            case 'user':
                return 'User';
            default:
                return scope;
        }
    };

    // If no result yet, show loading state
    if (!result) {
        return (
            <div className="border border-hacker-border rounded-lg p-4 bg-gradient-to-r from-hacker-bg to-hacker-bg-secondary shadow-lg shadow-hacker-accent/20">
                <div className="flex items-center gap-2 mb-3">
                    <Search className="w-5 h-5 text-hacker-accent-bright" />
                    <h3 className="font-medium text-hacker-text">Searching Memories</h3>
                </div>
                <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-hacker-accent/20 rounded w-3/4"></div>
                    <div className="h-4 bg-hacker-accent/20 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    // Show error state if the search failed
    if (result && !result.success) {
        return (
            <div className="border border-red-200 dark:border-red-700 rounded-lg p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20">
                <div className="flex items-center gap-2 mb-3">
                    <div className="text-lg text-red-500">❌</div>
                    <h3 className="font-medium text-red-600 dark:text-red-400">Memory Search Failed</h3>
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">
                    {result.message}
                </div>
            </div>
        );
    }

    const memories = result.memories;

    return (
        <div className="border border-hacker-border rounded-lg p-4 bg-gradient-to-r from-hacker-bg to-hacker-bg-secondary shadow-lg shadow-hacker-accent/20">
            <div className="flex items-center gap-2 mb-3">
                <Search className="w-5 h-5 text-hacker-accent-bright" />
                <h3 className="font-medium text-hacker-text">Memory Search Results</h3>
                <div className="ml-auto text-sm text-hacker-text-secondary">
                    {memories.length} result{memories.length !== 1 ? 's' : ''} found
                </div>
            </div>

            {/* Search query */}
            <div className="mb-4 p-2 bg-hacker-accent/10 border border-hacker-accent/20 rounded">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-hacker-text">Query:</span>
                    <span className="text-sm text-hacker-accent-bright">{args.query}</span>
                </div>
            </div>

            {/* Result message */}
            {result.message && (
                <div className="mb-4 p-2 bg-hacker-success/20 border border-hacker-success/40 rounded text-sm text-hacker-success">
                    {result.message}
                </div>
            )}

            {memories.length === 0 ? (
                <div className="text-sm text-hacker-text-secondary italic text-center py-4">
                    No memories found matching your query.
                </div>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {memories.map((memory, index) => (
                        <div
                            key={`${memory.key}-${index}`}
                            className="p-3 bg-gradient-to-r from-hacker-bg to-hacker-bg-secondary border border-hacker-border rounded-lg hover:shadow-lg hover:shadow-hacker-accent/20 transition-shadow"
                        >
                            {/* Memory header */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-hacker-accent-bright font-mono">
                                        {memory.key}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {getScopeIcon(memory.scope)}
                                        <span className="text-xs text-hacker-text-secondary">
                                            {getScopeLabel(memory.scope)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Memory content */}
                            <div className="text-sm text-hacker-text-secondary leading-relaxed">
                                {memory.value}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Scroll indicator */}
            {memories.length > 3 && (
                <div className="text-xs text-hacker-text-secondary mt-2 text-center">
                    ↑ Scroll to see more memories ↑
                </div>
            )}
        </div>
    );
} 