'use client';

import React from 'react';
import { Save, User, Users, Building, Brain } from "lucide-react";

interface SetMemoryResult {
    success: boolean;
    message: string;
    key: string;
    value: string;
    scope: string;
}

interface MemorySetPreviewProps {
    args: {
        key?: string;
        value?: string;
        scope?: string;
    };
    toolCallId: string;
    threadId: string;
    result?: SetMemoryResult;
}

export function MemorySetPreview({ args, toolCallId, threadId, result }: MemorySetPreviewProps) {
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
                    <Save className="w-5 h-5 text-hacker-accent-bright" />
                    <h3 className="font-medium text-hacker-text">Storing Memory</h3>
                </div>
                <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-hacker-accent/20 rounded w-3/4"></div>
                    <div className="h-4 bg-hacker-accent/20 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    // Show error state if memory storage failed
    if (result && !result.success) {
        return (
            <div className="border border-red-200 dark:border-red-700 rounded-lg p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20">
                <div className="flex items-center gap-2 mb-3">
                    <div className="text-lg text-red-500">❌</div>
                    <h3 className="font-medium text-red-600 dark:text-red-400">Memory Storage Failed</h3>
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">
                    {result.message}
                </div>
            </div>
        );
    }

    return (
        <div className="border border-hacker-border rounded-lg p-4 bg-gradient-to-r from-hacker-bg to-hacker-bg-secondary shadow-lg shadow-hacker-accent/20">
            <div className="flex items-center gap-2 mb-3">
                <Save className="w-5 h-5 text-hacker-accent-bright" />
                <h3 className="font-medium text-hacker-text">Memory Stored</h3>
                <div className="ml-auto">
                    <div className="flex items-center gap-1 text-sm text-hacker-success">
                        <div className="w-2 h-2 bg-hacker-success rounded-full"></div>
                        Success
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {/* Memory details */}
                <div className="p-3 bg-hacker-accent/10 border border-hacker-accent/20 rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-hacker-text">Key:</span>
                        <span className="text-sm text-hacker-accent-bright font-mono">{result.key}</span>
                    </div>
                    <div className="text-sm text-hacker-text-secondary">
                        {result.value}
                    </div>
                </div>

                {/* Scope indicator */}
                <div className="flex items-center gap-2">
                    {getScopeIcon(result.scope)}
                    <span className="text-sm text-hacker-text-secondary">
                        Scope: <span className="text-hacker-accent">{getScopeLabel(result.scope)}</span>
                    </span>
                </div>

                {/* Success message */}
                {result.message && (
                    <div className="p-2 bg-hacker-success/20 border border-hacker-success/40 rounded text-sm text-hacker-success">
                        {result.message}
                    </div>
                )}
            </div>
        </div>
    );
} 