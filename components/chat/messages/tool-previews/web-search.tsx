'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface WebSearchPreviewProps {
    args: { query: string };
    toolCallId: string;
}

export function WebSearchPreview({ args, toolCallId }: WebSearchPreviewProps) {
    const backgroungJobStatus = useQuery(api.backgroundJobStatuses.getBackgroundJobStatus, { toolCallId });

    if (!backgroungJobStatus) {
        return <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-16 rounded-lg" />;
    }

    const currentStatus = backgroungJobStatus.statusUpdates[backgroungJobStatus.statusUpdates.length - 1];
    const currentProgress = currentStatus?.progress || 0;

    return (
        <div className="border border-hacker-border rounded-lg p-4 bg-gradient-to-r from-hacker-bg to-hacker-bg-secondary shadow-lg shadow-hacker-accent/20">
            <div className="flex items-center gap-2 mb-3">
                <div className="text-lg text-hacker-accent-bright">🔍</div>
                <h3 className="font-medium text-hacker-text">Web Search</h3>
                <div className="ml-auto">
                    {currentStatus?.status === "running" && (
                        <div className="flex items-center gap-1 text-hacker-progress text-sm">
                            <div className="animate-spin w-3 h-3 border border-hacker-progress border-t-transparent rounded-full" />
                            {currentProgress}%
                        </div>
                    )}
                    {currentStatus?.status === "completed" && (
                        <div className="text-hacker-success text-sm">✅ Complete</div>
                    )}
                    {currentStatus?.status === "failed" && (
                        <div className="text-hacker-error text-sm">❌ Failed</div>
                    )}
                </div>
            </div>

            {/* Search query */}
            <div className="text-sm text-hacker-text-secondary mb-3">
                Searching for: <span className="font-medium text-hacker-text">"{args.query}"</span>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-hacker-text-secondary mb-1">
                    <span>Progress</span>
                    <span>{currentProgress}%</span>
                </div>
                <div className="w-full bg-hacker-progress/20 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-hacker-progress to-hacker-progress-bright h-2 rounded-full transition-all duration-300 ease-out shadow-sm shadow-hacker-progress/50"
                        style={{ width: `${currentProgress}%` }}
                    />
                </div>
            </div>

            {/* All status updates */}
            <div className="space-y-2">
                {backgroungJobStatus.statusUpdates.map((status, index) => {
                    const isLatest = index === backgroungJobStatus.statusUpdates.length - 1;
                    const isCompleted = status.status === "completed";
                    const isFailed = status.status === "failed";

                    return (
                        <div
                            key={`${status.message}-${status.timestamp}`}
                            className={`flex items-center gap-3 p-2 rounded transition-all ${isLatest && status.status === "running"
                                ? 'bg-hacker-progress/20 border-l-2 border-hacker-progress shadow-sm shadow-hacker-progress/20'
                                : isCompleted
                                    ? 'bg-hacker-success/10 border-l-2 border-hacker-success/50'
                                    : isFailed
                                        ? 'bg-hacker-error/10 border-l-2 border-hacker-error/50'
                                        : 'bg-hacker-pending/10 border border-hacker-pending/20'
                                }`}
                        >
                            <div className={`text-sm ${isLatest && status.status === "running" ? 'animate-pulse' : ''}`}>
                                {isCompleted ? '✅' :
                                    isFailed ? '❌' :
                                        isLatest && status.status === "running" ? '🔄' : '✅'}
                            </div>
                            <div className="flex-1">
                                <div className={`text-sm font-medium ${isLatest && status.status === "running"
                                    ? 'text-hacker-progress-bright'
                                    : isCompleted
                                        ? 'text-hacker-success'
                                        : isFailed
                                            ? 'text-hacker-error'
                                            : 'text-hacker-text'
                                    }`}>
                                    {status.message}
                                </div>
                            </div>
                            <div className="text-xs text-hacker-text-secondary">
                                {status.progress}%
                            </div>
                            {isLatest && status.status === "running" && (
                                <div className="w-2 h-2 bg-hacker-progress rounded-full animate-pulse" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

