'use client';

import React from 'react';

interface InterpreterArgs {
    code?: string;
    language?: string;
    input?: string;
}

// Future complex result interface - commented for now
// interface InterpreterResult {
//     success: boolean;
//     output?: string;
//     error?: string;
//     executionTime?: number;
// }

interface InterpreterPreviewProps {
    args: InterpreterArgs;
    toolCallId: string;
    result?: string;
}

export function InterpreterPreview({ args, toolCallId, result }: InterpreterPreviewProps) {
    // Simplified logic for demo - just check if we have result
    const isRunning = !result;
    const isCompleted = !!result;

    const getStatusIcon = () => {
        if (isRunning) return '⚡';
        if (isCompleted) return '✅';
        return '💻';
    };

    const getStatusText = () => {
        if (isRunning) return 'Executing Code';
        if (isCompleted) return 'Execution Complete';
        return 'Code Interpreter';
    };

    const getStatusColor = () => {
        if (isRunning) return 'text-hacker-accent-bright';
        if (isCompleted) return 'text-green-400';
        return 'text-hacker-text';
    };

    return (
        <div className="w-full border border-hacker-border rounded-lg p-4 bg-gradient-to-r from-hacker-bg to-hacker-bg-secondary shadow-lg shadow-hacker-accent/20">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="text-lg">{getStatusIcon()}</div>
                <h3 className={`font-medium ${getStatusColor()}`}>{getStatusText()}</h3>
                {args.language && (
                    <div className="ml-auto text-sm text-hacker-text-secondary bg-hacker-accent/20 px-2 py-1 rounded">
                        {args.language}
                    </div>
                )}
            </div>

            {/* Code Input - Demo version */}
            {(args.code || args.input) && (
                <div className="mb-4">
                    <div className="text-sm font-medium text-hacker-text mb-2">Code:</div>
                    <div className="bg-black/50 border border-hacker-accent/30 rounded-lg p-4 font-mono text-sm">
                        <pre className="text-hacker-accent-bright whitespace-pre-wrap overflow-x-auto">
                            {args.code || args.input}
                        </pre>
                    </div>
                </div>
            )}

            {/* Execution Status */}
            {isRunning && (
                <div className="mb-4 p-3 bg-hacker-accent/10 border border-hacker-accent/20 rounded flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border border-hacker-accent border-t-transparent rounded-full"></div>
                    <span className="text-sm text-hacker-accent-bright">Running code in sandbox...</span>
                </div>
            )}

            {/* Simple Result Display - Demo version */}
            {result && (
                <div className="space-y-3">
                    <div>
                        <div className="text-sm font-medium text-hacker-text mb-2">Output:</div>
                        <div className="bg-black/50 border border-green-500/30 rounded-lg p-4 font-mono text-sm">
                            <pre className="text-green-400 whitespace-pre-wrap overflow-x-auto">
                                {result}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Future complex result handling - commented for later use */}
            {/* 
            {result && (
                <div className="space-y-3">
                    {result.success && result.output && (
                        <div>
                            <div className="text-sm font-medium text-hacker-text mb-2">Output:</div>
                            <div className="bg-black/50 border border-green-500/30 rounded-lg p-4 font-mono text-sm">
                                <pre className="text-green-400 whitespace-pre-wrap overflow-x-auto">
                                    {result.output}
                                </pre>
                            </div>
                        </div>
                    )}

                    {result.error && (
                        <div>
                            <div className="text-sm font-medium text-red-400 mb-2">Error:</div>
                            <div className="bg-black/50 border border-red-500/30 rounded-lg p-4 font-mono text-sm">
                                <pre className="text-red-400 whitespace-pre-wrap overflow-x-auto">
                                    {result.error}
                                </pre>
                            </div>
                        </div>
                    )}

                    {result.success && !result.output && (
                        <div className="p-2 bg-hacker-success/20 border border-hacker-success/40 rounded text-sm text-hacker-success">
                            Code executed successfully
                        </div>
                    )}
                </div>
            )}
            */}
        </div>
    );
}
