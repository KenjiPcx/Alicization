'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';

interface FileIngestionPreviewProps {
    args: {
        url: string;
        name: string;
        contentType: string;
        category?: string;
    };
    toolCallId: string;
    result?: {
        success: boolean;
        message: string;
        backgroundJobStatusId?: string;
        companyFileId?: string;
        fileName?: string;
    };
}

export function FileIngestionPreview({ args, toolCallId, result }: FileIngestionPreviewProps) {
    const backgroundJobStatus = useQuery(api.backgroundJobStatuses.getBackgroundJobStatus, { toolCallId });

    if (!backgroundJobStatus) {
        return <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-16 rounded-lg" />;
    }

    const currentStatus = backgroundJobStatus.statusUpdates[backgroundJobStatus.statusUpdates.length - 1];
    const currentProgress = currentStatus?.progress || 0;
    const isCompleted = currentStatus?.status === "completed";

    const getFileIcon = () => {
        if (args.contentType === 'application/pdf') return '📄';
        if (args.contentType?.startsWith('text/')) return '📝';
        if (args.contentType?.startsWith('image/')) return '🖼️';
        return '📁';
    };

    const getCategoryBadge = () => {
        const category = args.category || 'document';
        const badges = {
            policy: { icon: '⚖️', label: 'Policy' },
            manual: { icon: '📚', label: 'Manual' },
            specification: { icon: '🔧', label: 'Spec' },
            document: { icon: '📄', label: 'Doc' },
        };
        return badges[category as keyof typeof badges] || badges.document;
    };

    const categoryBadge = getCategoryBadge();

    return (
        <div className="border border-blue-400/50 dark:border-blue-500/50 rounded-lg p-4 bg-gradient-to-r from-blue-50/90 to-cyan-50/90 dark:from-blue-900/20 dark:to-cyan-900/20 shadow-lg shadow-blue-200/30 dark:shadow-blue-900/20">
            <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100/60 dark:bg-blue-800/40 border border-blue-300/50 dark:border-blue-600/50">
                    <span className="text-lg">{getFileIcon()}</span>
                </div>
                <div className="flex-1">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                        Saving File to Knowledge Base
                    </h3>
                    <div className="text-xs text-blue-700 dark:text-blue-300 truncate">
                        {args.name}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "px-2 py-1 rounded text-xs font-medium border",
                        "bg-blue-100/50 dark:bg-blue-800/30 border-blue-300/50 dark:border-blue-600/50 text-blue-800 dark:text-blue-200"
                    )}>
                        {categoryBadge.icon} {categoryBadge.label}
                    </div>
                    {currentStatus?.status === "running" && (
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm">
                            <div className="animate-spin w-3 h-3 border border-blue-600 dark:border-blue-400 border-t-transparent rounded-full" />
                            {currentProgress}%
                        </div>
                    )}
                    {currentStatus?.status === "completed" && (
                        <div className="text-green-600 dark:text-green-400 text-sm">✅ Saved</div>
                    )}
                    {currentStatus?.status === "failed" && (
                        <div className="text-red-600 dark:text-red-400 text-sm">❌ Failed</div>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300 mb-1">
                    <span>Processing</span>
                    <span>{currentProgress}%</span>
                </div>
                <div className="w-full bg-blue-200/50 dark:bg-blue-800/30 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300 ease-out shadow-sm shadow-blue-500/50"
                        style={{ width: `${currentProgress}%` }}
                    />
                </div>
            </div>

            {/* Status updates */}
            <div className="space-y-2">
                {backgroundJobStatus.statusUpdates.map((status, index) => {
                    const isLatest = index === backgroundJobStatus.statusUpdates.length - 1;
                    const isStatusCompleted = status.status === "completed";
                    const isStatusFailed = status.status === "failed";

                    return (
                        <div
                            key={`${status.message}-${status.timestamp}`}
                            className={cn(
                                "flex items-center gap-3 p-2 rounded transition-all",
                                isLatest && status.status === "running"
                                    ? 'bg-blue-100/50 dark:bg-blue-800/20 border-l-2 border-blue-500 shadow-sm shadow-blue-500/20'
                                    : isStatusCompleted
                                        ? 'bg-green-50/50 dark:bg-green-900/10 border-l-2 border-green-500/50'
                                        : isStatusFailed
                                            ? 'bg-red-50/50 dark:bg-red-900/10 border-l-2 border-red-500/50'
                                            : 'bg-blue-50/30 dark:bg-blue-900/10 border border-blue-200/20 dark:border-blue-700/20'
                            )}
                        >
                            <div className={cn("text-sm", isLatest && status.status === "running" ? 'animate-pulse' : '')}>
                                {isStatusCompleted ? '✅' :
                                    isStatusFailed ? '❌' :
                                        isLatest && status.status === "running" ? '🔄' : '✅'}
                            </div>
                            <div className="flex-1">
                                <div className={cn(
                                    "text-sm font-medium",
                                    isLatest && status.status === "running"
                                        ? 'text-blue-700 dark:text-blue-300'
                                        : isStatusCompleted
                                            ? 'text-green-700 dark:text-green-300'
                                            : isStatusFailed
                                                ? 'text-red-700 dark:text-red-300'
                                                : 'text-blue-600 dark:text-blue-400'
                                )}>
                                    {status.message}
                                </div>
                            </div>
                            <div className="text-xs text-blue-500 dark:text-blue-400">
                                {status.progress}%
                            </div>
                            {isLatest && status.status === "running" && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Success message */}
            {isCompleted && result?.success && (
                <div className="mt-4 border-t border-blue-200/50 dark:border-blue-700/50 pt-4">
                    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                        <span>🎉</span>
                        <span className="font-medium">
                            File successfully added to knowledge base!
                        </span>
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        The team can now search and reference this document.
                    </div>
                </div>
            )}
        </div>
    );
} 