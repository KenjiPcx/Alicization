import React from 'react';

interface WebSearchResult {
    answer: string;
    source: string;
}

interface WebSearchResultsProps {
    results: WebSearchResult[];
}

export function WebSearchResults({ results }: WebSearchResultsProps) {
    if (!results || results.length === 0) {
        return (
            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                No search results found.
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex items-center gap-2 mb-3">
                <div className="text-lg">🔍</div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Search Results</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    {results.length} result{results.length !== 1 ? 's' : ''} found
                </div>
            </div>

            {/* Horizontal scrollable carousel with modern scrollbar */}
            <div className="flex gap-4 overflow-x-auto pb-3 pr-1 modern-scrollbar">
                {results.map((result, index) => (
                    <div
                        key={`${result.source}-${result.answer.slice(0, 20)}`}
                        className="flex-shrink-0 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-shadow"
                    >
                        {/* Answer */}
                        <div className="mb-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-5 leading-relaxed">
                                {result.answer}
                            </div>
                        </div>

                        {/* Source */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div className="flex items-center gap-2">
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">SOURCE:</div>
                                <div className="flex-1 min-w-0">
                                    <a
                                        href={result.source}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline block truncate"
                                        title={result.source}
                                    >
                                        {formatSourceUrl(result.source)}
                                    </a>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => window.open(result.source, '_blank')}
                                    className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
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
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
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
                    background: rgba(156, 163, 175, 0.4);
                    border-radius: 10px;
                    transition: all 0.2s ease;
                }
                
                .modern-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(156, 163, 175, 0.6);
                }
                
                @media (prefers-color-scheme: dark) {
                    .modern-scrollbar {
                        scrollbar-color: rgba(107, 114, 128, 0.5) transparent;
                    }
                    
                    .modern-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(107, 114, 128, 0.4);
                    }
                    
                    .modern-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(107, 114, 128, 0.6);
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
