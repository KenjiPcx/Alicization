'use client';

import { SearchResult } from '@convex-dev/rag';
import React from 'react';

interface KnowledgeSearchResponse {
    success: boolean;
    message: string;
    results?: SearchResult[];
    query?: string;
    resultCount?: number;
}

interface KnowledgeSearchResultsProps {
    results: KnowledgeSearchResponse;
}

export function KnowledgeSearchResults({ results: response }: KnowledgeSearchResultsProps) {
    console.log("Kenji response", response);
    const results = response?.results || [];

    if (!response || !response.success || !Array.isArray(results) || results.length === 0) {
        return (
            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                {response?.message || "No knowledge base results found."}
            </div>
        );
    }

    const getFileIcon = (contentType?: string) => {
        if (contentType === 'application/pdf') return '📄';
        if (contentType?.startsWith('text/')) return '📝';
        if (contentType?.startsWith('image/')) return '🖼️';
        return '📁';
    };

    const getCategoryIcon = (category?: string) => {
        const icons = {
            policy: '⚖️',
            manual: '📚',
            specification: '🔧',
            document: '📄',
        };
        return icons[category as keyof typeof icons] || '📄';
    };

    return (
        <div className="w-full">
            <div className="flex items-center gap-2 mb-3">
                <div className="text-lg text-indigo-600 dark:text-indigo-400">🔍</div>
                <h3 className="font-medium text-indigo-900 dark:text-indigo-100">Knowledge Base Results</h3>
                <div className="text-sm text-indigo-600 dark:text-indigo-400">
                    {results.length} result{results.length !== 1 ? 's' : ''} found
                </div>
                <div className="px-2 py-1 rounded text-xs font-medium bg-indigo-100/50 dark:bg-indigo-800/30 border border-indigo-300/50 dark:border-indigo-600/50 text-indigo-800 dark:text-indigo-200">
                    🔒 Private
                </div>
            </div>

            {/* Show search query if available */}
            {response.query && (
                <div className="text-sm text-indigo-600 dark:text-indigo-400 mb-3">
                    Query: <span className="font-medium text-indigo-900 dark:text-indigo-100">&quot;{response.query}&quot;</span>
                </div>
            )}

            {/* Vertical list of results */}
            <div className="space-y-4">
                {results.map((result, index) => {
                    // Get the first content item for display (results might have multiple content chunks)
                    const firstContent = result.content[0];
                    const metadata = firstContent?.metadata || {};
                    const text = result.content.map(c => c.text).join(' ').trim();

                    return (
                        <div
                            key={`${result.entryId}-${index}`}
                            className="bg-gradient-to-r from-indigo-50/90 to-purple-50/90 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200/50 dark:border-indigo-700/50 rounded-lg p-4 shadow-lg shadow-indigo-200/20 dark:shadow-indigo-900/20"
                        >
                            {/* Header with file info */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100/60 dark:bg-indigo-800/40 border border-indigo-300/50 dark:border-indigo-600/50">
                                    <span className="text-sm">
                                        {getFileIcon(metadata.contentType)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-indigo-900 dark:text-indigo-100 text-sm truncate">
                                        {metadata.fileName || 'Unknown Document'}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                                        {metadata.category && (
                                            <span className="flex items-center gap-1">
                                                {getCategoryIcon(metadata.category)}
                                                {metadata.category}
                                            </span>
                                        )}
                                        {metadata.page && (
                                            <span>• Page {metadata.page}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-xs text-indigo-500 dark:text-indigo-400 font-mono">
                                    {Math.round(result.score * 100)}% match
                                </div>
                            </div>

                            {/* Content */}
                            <div className="mb-3">
                                {metadata.title && (
                                    <div className="font-medium text-indigo-800 dark:text-indigo-200 text-sm mb-1">
                                        {metadata.title}
                                    </div>
                                )}
                                <div className="text-sm text-indigo-900 dark:text-indigo-100 leading-relaxed">
                                    {text}
                                </div>
                            </div>

                            {/* Metadata footer */}
                            <div className="border-t border-indigo-200/50 dark:border-indigo-700/50 pt-3">
                                <div className="flex flex-wrap gap-4 text-xs">
                                    {metadata.summary && (
                                        <div className="flex-1 min-w-0">
                                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">Summary:</span>
                                            <span className="text-indigo-700 dark:text-indigo-300 ml-1">
                                                {metadata.summary}
                                            </span>
                                        </div>
                                    )}
                                    {metadata.keywords && (
                                        <div className="flex-1 min-w-0">
                                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">Keywords:</span>
                                            <span className="text-indigo-700 dark:text-indigo-300 ml-1">
                                                {metadata.keywords}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {metadata.documentTags && Array.isArray(metadata.documentTags) && metadata.documentTags.length > 0 && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-indigo-600 dark:text-indigo-400 font-medium text-xs">Tags:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {metadata.documentTags.map((tag: string, tagIndex: number) => (
                                                <span
                                                    key={tagIndex}
                                                    className="px-2 py-1 rounded text-xs bg-indigo-100/50 dark:bg-indigo-800/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-600/50"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {metadata.sourceUrl && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-indigo-600 dark:text-indigo-400 font-medium text-xs">Source:</span>
                                        <a
                                            href={metadata.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 hover:underline truncate"
                                            title={metadata.sourceUrl}
                                        >
                                            {formatSourceUrl(metadata.sourceUrl)}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary footer */}
            <div className="mt-4 text-center">
                <div className="text-xs text-indigo-600 dark:text-indigo-400">
                    Searched {results.length} document{results.length !== 1 ? 's' : ''} from your private knowledge base
                </div>
            </div>
        </div>
    );
}

function formatSourceUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        const path = urlObj.pathname;

        if (path.length > 30) {
            return `${domain}${path.substring(0, 27)}...`;
        }

        return `${domain}${path}`;
    } catch {
        return url.length > 40 ? `${url.substring(0, 37)}...` : url;
    }
} 