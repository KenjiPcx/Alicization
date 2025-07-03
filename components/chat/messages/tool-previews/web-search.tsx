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
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
            <div className="flex items-center gap-2 mb-3">
                <div className="text-lg">🔍</div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Web Search</h3>
                <div className="ml-auto">
                    {currentStatus?.status === "running" && (
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm">
                            <div className="animate-spin w-3 h-3 border border-blue-600 dark:border-blue-400 border-t-transparent rounded-full" />
                            {currentProgress}%
                        </div>
                    )}
                    {currentStatus?.status === "completed" && (
                        <div className="text-green-600 dark:text-green-400 text-sm">✅ Complete</div>
                    )}
                    {currentStatus?.status === "failed" && (
                        <div className="text-red-600 dark:text-red-400 text-sm">❌ Failed</div>
                    )}
                </div>
            </div>

            {/* Search query */}
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Searching for: <span className="font-medium text-gray-900 dark:text-gray-100">"{args.query}"</span>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{currentProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                        className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all duration-300 ease-out"
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
                                ? 'bg-blue-100 dark:bg-blue-900/30 border-l-2 border-blue-500 dark:border-blue-400'
                                : isCompleted
                                    ? 'bg-green-50 dark:bg-green-900/20'
                                    : isFailed
                                        ? 'bg-red-50 dark:bg-red-900/20'
                                        : 'bg-gray-50 dark:bg-gray-800'
                                }`}
                        >
                            <div className={`text-sm ${isLatest && status.status === "running" ? 'animate-pulse' : ''}`}>
                                {isCompleted ? '✅' :
                                    isFailed ? '❌' :
                                        isLatest && status.status === "running" ? '🔄' : '✅'}
                            </div>
                            <div className="flex-1">
                                <div className={`text-sm font-medium ${isLatest && status.status === "running"
                                    ? 'text-blue-900 dark:text-blue-100'
                                    : isCompleted
                                        ? 'text-green-900 dark:text-green-100'
                                        : isFailed
                                            ? 'text-red-900 dark:text-red-100'
                                            : 'text-gray-900 dark:text-gray-100'
                                    }`}>
                                    {status.message}
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {status.progress}%
                            </div>
                            {isLatest && status.status === "running" && (
                                <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

