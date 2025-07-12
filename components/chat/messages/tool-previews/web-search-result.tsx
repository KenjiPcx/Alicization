'use client';

import React from 'react';

interface WebSearchResult {
    content: string;
    sourceUrl: string;
}

interface WebSearchResponse {
    success: boolean;
    message: string;
    results?: WebSearchResult[];
    query?: string;
    resultCount?: number;
}

interface WebSearchResultsProps {
    results: WebSearchResponse;
}

export function WebSearchResults({ results: response }: WebSearchResultsProps) {
    console.log("Key results", response);

    // Extract the actual results array from the response
    const results = response?.results || [];

    if (!response || !response.success || !Array.isArray(results) || results.length === 0) {
        return (
            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                {response?.message || "No search results found."}
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex items-center gap-2 mb-3">
                <div className="text-lg text-hacker-accent-bright">🔍</div>
                <h3 className="font-medium text-hacker-text">Search Results</h3>
                <div className="text-sm text-hacker-text-secondary">
                    {results.length} result{results.length !== 1 ? 's' : ''} found
                </div>
            </div>

            {/* Show search query if available */}
            {response.query && (
                <div className="text-sm text-hacker-text-secondary mb-3">
                    Searching for: <span className="font-medium text-hacker-text">&quot;{response.query}&quot;</span>
                </div>
            )}

            {/* Horizontal scrollable carousel with modern scrollbar */}
            <div className="flex gap-4 overflow-x-auto pb-3 pr-1 modern-scrollbar">
                {results.map((result, index) => (
                    <div
                        key={`${index}-${result.sourceUrl}-${result.content.slice(0, 20)}`}
                        className="flex-shrink-0 w-80 bg-gradient-to-r from-hacker-bg to-hacker-bg-secondary border border-hacker-border rounded-lg p-5 shadow-lg shadow-hacker-accent/20 hover:shadow-xl hover:shadow-hacker-accent/30 transition-shadow"
                    >
                        {/* Content */}
                        <div className="mb-4">
                            <div className="text-sm font-medium text-hacker-text mb-2 line-clamp-5 leading-relaxed">
                                {result.content}
                            </div>
                        </div>

                        {/* Source */}
                        <div className="border-t border-hacker-border pt-4">
                            <div className="flex items-center gap-2">
                                <div className="text-xs text-hacker-text-secondary font-medium whitespace-nowrap">SOURCE:</div>
                                <div className="flex-1 min-w-0">
                                    <a
                                        href={result.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-hacker-accent hover:text-hacker-accent-bright hover:underline block truncate"
                                        title={result.sourceUrl}
                                    >
                                        {formatSourceUrl(result.sourceUrl)}
                                    </a>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => window.open(result.sourceUrl, '_blank')}
                                    className="text-xs text-hacker-text-secondary hover:text-hacker-accent transition-colors flex-shrink-0 p-1 hover:bg-hacker-accent/20 rounded"
                                    title="Open in new tab"
                                >
                                    ↗
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Show more indicator if results are scrollable */}
            {results.length > 1 && (
                <div className="text-xs text-hacker-text-secondary mt-2 text-center">
                    ← Scroll to see more results →
                </div>
            )}

            {/* Modern scrollbar styles */}
            <style>{`
                .modern-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
                }
                
                .modern-scrollbar::-webkit-scrollbar {
                    height: 6px;
                }
                
                .modern-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                    border-radius: 10px;
                }
                
                .modern-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--hacker-accent);
                    border-radius: 10px;
                    transition: all 0.2s ease;
                    opacity: 0.4;
                }
                
                .modern-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--hacker-accent-bright);
                    opacity: 0.6;
                }
                
                @media (prefers-color-scheme: dark) {
                    .modern-scrollbar {
                        scrollbar-color: var(--hacker-accent) transparent;
                    }
                    
                    .modern-scrollbar::-webkit-scrollbar-thumb {
                        background: var(--hacker-accent);
                        opacity: 0.4;
                    }
                    
                    .modern-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: var(--hacker-accent-bright);
                        opacity: 0.6;
                    }
                }
                
                /* Auto-hide scrollbar */
                .modern-scrollbar::-webkit-scrollbar {
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .modern-scrollbar:hover::-webkit-scrollbar {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
}

function formatSourceUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        const path = urlObj.pathname;

        // Make URL shorter for better fit
        if (path.length > 25) {
            return `${domain}${path.substring(0, 22)}...`;
        }

        return `${domain}${path}`;
    } catch {
        // If URL parsing fails, just truncate the original more aggressively
        return url.length > 35 ? `${url.substring(0, 32)}...` : url;
    }
}
