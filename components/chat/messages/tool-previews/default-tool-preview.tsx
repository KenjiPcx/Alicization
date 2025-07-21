'use client';

import React, { useState } from 'react';

interface DefaultToolPreviewProps {
    toolName: string;
    args: any;
    result: any;
    toolCallId: string;
}

export function DefaultToolPreview({ toolName, args, result, toolCallId }: DefaultToolPreviewProps) {
    const [isArgsExpanded, setIsArgsExpanded] = useState(false);
    const [isResultExpanded, setIsResultExpanded] = useState(false);

    const formatJson = (data: any) => JSON.stringify(data, null, 2);

    const truncateContent = (content: string, maxChars: number = 500) => {
        if (content.length <= maxChars) {
            return { content, isTruncated: false };
        }
        return {
            content: content.substring(0, maxChars) + '...',
            isTruncated: true
        };
    };

    const argsJson = formatJson(args);
    const resultJson = formatJson(result);

    const truncatedArgs = truncateContent(argsJson);
    const truncatedResult = truncateContent(resultJson);

    const CollapsibleSection = ({
        title,
        content,
        truncatedContent,
        isExpanded,
        onToggle,
        isTruncated
    }: {
        title: string;
        content: string;
        truncatedContent: string;
        isExpanded: boolean;
        onToggle: () => void;
        isTruncated: boolean;
    }) => (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-hacker-text">{title}:</div>
                {isTruncated && (
                    <button
                        onClick={onToggle}
                        className="flex items-center gap-1 text-xs text-hacker-accent hover:text-hacker-accent-bright transition-colors px-2 py-1 rounded bg-hacker-accent/10"
                    >
                        {isExpanded ? (
                            <>
                                <span>Collapse</span>
                                <span>▲</span>
                            </>
                        ) : (
                            <>
                                <span>Expand</span>
                                <span>▼</span>
                            </>
                        )}
                    </button>
                )}
            </div>
            <div className="bg-black/50 border border-hacker-accent/30 rounded-lg p-4 font-mono text-sm">
                <pre className="text-hacker-accent-bright whitespace-pre-wrap overflow-x-auto">
                    {isExpanded ? content : truncatedContent}
                </pre>
            </div>
        </div>
    );

    return (
        <div className="w-full border border-hacker-border rounded-lg p-4 bg-gradient-to-r from-hacker-bg to-hacker-bg-secondary shadow-lg shadow-hacker-accent/20">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="text-lg">🔧</div>
                <h3 className="font-medium text-hacker-text">Tool Result</h3>
                <div className="ml-auto text-sm text-hacker-text-secondary bg-hacker-accent/20 px-2 py-1 rounded">
                    {toolName}
                </div>
            </div>

            <div className="space-y-4">
                {/* Arguments Section */}
                {args && Object.keys(args).length > 0 && (
                    <CollapsibleSection
                        title="Arguments"
                        content={argsJson}
                        truncatedContent={truncatedArgs.content}
                        isExpanded={isArgsExpanded}
                        onToggle={() => setIsArgsExpanded(!isArgsExpanded)}
                        isTruncated={truncatedArgs.isTruncated}
                    />
                )}

                {/* Result Section */}
                {result !== undefined && (
                    <CollapsibleSection
                        title="Output"
                        content={resultJson}
                        truncatedContent={truncatedResult.content}
                        isExpanded={isResultExpanded}
                        onToggle={() => setIsResultExpanded(!isResultExpanded)}
                        isTruncated={truncatedResult.isTruncated}
                    />
                )}
            </div>
        </div>
    );
} 