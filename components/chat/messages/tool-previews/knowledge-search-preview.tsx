'use client';

import React from 'react';

interface KnowledgeSearchPreviewProps {
    args: {
        query: string;
        limit?: number;
        namespace?: string;
    };
    toolCallId: string;
}

export function KnowledgeSearchPreview({ args }: KnowledgeSearchPreviewProps) {
    return (
        <div className="border border-indigo-400/50 dark:border-indigo-500/50 rounded-lg p-4 bg-gradient-to-r from-indigo-50/90 to-purple-50/90 dark:from-indigo-900/20 dark:to-purple-900/20 shadow-lg shadow-indigo-200/30 dark:shadow-indigo-900/20">
            <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100/60 dark:bg-indigo-800/40 border border-indigo-300/50 dark:border-indigo-600/50">
                    <div className="animate-spin w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full" />
                </div>
                <div className="flex-1">
                    <h3 className="font-medium text-indigo-900 dark:text-indigo-100 text-sm">
                        Searching Private Knowledge Base
                    </h3>
                    <div className="text-xs text-indigo-700 dark:text-indigo-300">
                        Searching company files and documents...
                    </div>
                </div>
                <div className="px-2 py-1 rounded text-xs font-medium bg-indigo-100/50 dark:bg-indigo-800/30 border border-indigo-300/50 dark:border-indigo-600/50 text-indigo-800 dark:text-indigo-200">
                    🔒 Private
                </div>
            </div>

            {/* Search query */}
            <div className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
                Query: <span className="font-medium text-indigo-900 dark:text-indigo-100">&quot;{args.query}&quot;</span>
            </div>

            {/* Simple animated loading bar */}
            <div className="w-full bg-indigo-200/50 dark:bg-indigo-800/30 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse" style={{
                    width: '60%',
                    animation: 'loading-slide 1.5s ease-in-out infinite'
                }} />
            </div>

            {/* Animated dots */}
            <div className="flex items-center justify-center gap-1 mt-4">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>

            <style jsx>{`
                @keyframes loading-slide {
                    0% {
                        transform: translateX(-100%);
                        width: 30%;
                    }
                    50% {
                        transform: translateX(0%);
                        width: 60%;
                    }
                    100% {
                        transform: translateX(200%);
                        width: 30%;
                    }
                }
            `}</style>
        </div>
    );
} 