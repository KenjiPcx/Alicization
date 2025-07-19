'use client';

import React from 'react';
import { UserIcon, MessageIcon } from '../../../icons';
import { cn } from '@/lib/utils';

interface HumanCollabPreviewProps {
    args: {
        message: string;
        type: "approval" | "review" | "question" | "permission";
        context?: string;
    };
    toolCallId: string;
    result?: {
        success: boolean;
        message: string;
    };
}

export function HumanCollabPreview({ args, toolCallId, result }: HumanCollabPreviewProps) {
    const getTypeIcon = () => {
        switch (args.type) {
            case 'approval':
                return '✋';
            case 'review':
                return '👀';
            case 'question':
                return '❓';
            case 'permission':
                return '🔐';
            default:
                return '💬';
        }
    };

    const getTypeLabel = () => {
        switch (args.type) {
            case 'approval':
                return 'APPROVAL NEEDED';
            case 'review':
                return 'REVIEW REQUESTED';
            case 'question':
                return 'QUESTION';
            case 'permission':
                return 'PERMISSION NEEDED';
            default:
                return 'HUMAN INPUT';
        }
    };

    const getTypeColors = () => {
        const baseColors = {
            // Light mode colors
            border: 'border-amber-300/50 dark:border-amber-600/50',
            bg: 'bg-gradient-to-r from-amber-50/90 to-orange-50/90 dark:from-amber-900/20 dark:to-orange-900/20',
            bgSecondary: 'bg-amber-100/30 dark:bg-amber-800/20',
            text: 'text-amber-900 dark:text-amber-100',
            textSecondary: 'text-amber-700 dark:text-amber-300',
            accent: 'text-amber-600 dark:text-amber-400',
            accentBright: 'text-amber-800 dark:text-amber-200',
        };

        // Type-specific variants for both light and dark modes
        switch (args.type) {
            case 'approval':
                return {
                    ...baseColors,
                    border: 'border-orange-400/50 dark:border-orange-500/50',
                    bg: 'bg-gradient-to-r from-orange-50/90 to-amber-50/90 dark:from-orange-900/20 dark:to-amber-900/20',
                    accent: 'text-orange-600 dark:text-orange-400',
                    accentBright: 'text-orange-800 dark:text-orange-200',
                };
            case 'review':
                return {
                    ...baseColors,
                    border: 'border-yellow-400/50 dark:border-yellow-500/50',
                    bg: 'bg-gradient-to-r from-yellow-50/90 to-amber-50/90 dark:from-yellow-900/20 dark:to-amber-900/20',
                    accent: 'text-yellow-600 dark:text-yellow-400',
                    accentBright: 'text-yellow-800 dark:text-yellow-200',
                };
            case 'permission':
                return {
                    ...baseColors,
                    border: 'border-red-300/50 dark:border-red-500/50',
                    bg: 'bg-gradient-to-r from-red-50/90 to-orange-50/90 dark:from-red-900/20 dark:to-orange-900/20',
                    accent: 'text-red-600 dark:text-red-400',
                    accentBright: 'text-red-800 dark:text-red-200',
                    text: 'text-red-900 dark:text-red-100',
                    textSecondary: 'text-red-700 dark:text-red-300',
                };
            default:
                return baseColors;
        }
    };

    const colors = getTypeColors();

    // If we have a result, show completed state
    if (result) {
        return (
            <div className={cn(
                "border rounded-lg p-4 shadow-lg",
                colors.border,
                colors.bg
            )}>
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/50 dark:bg-white/10 border border-current/20">
                        <UserIcon />
                    </div>
                    <div className="flex-1">
                        <h3 className={cn("font-medium text-sm", colors.accentBright)}>
                            Human Request Sent
                        </h3>
                    </div>
                    <div className={cn("flex items-center justify-center w-6 h-6 rounded-full", colors.bgSecondary)}>
                        <MessageIcon size={14} />
                    </div>
                </div>

                <div className={cn("text-sm rounded-lg p-3 border border-current/10", colors.bgSecondary, colors.text)}>
                    {result.message}
                </div>
            </div>
        );
    }

    // Show pending human input state
    return (
        <div className={cn(
            "border rounded-lg p-4 shadow-lg shadow-amber-200/30 dark:shadow-amber-900/20 relative overflow-hidden",
            colors.border,
            colors.bg
        )}>
            {/* Subtle animated background pulse */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent animate-pulse opacity-50" />

            {/* Status badge */}
            <div className="absolute top-3 right-3 z-10">
                <div className={cn(
                    "px-2 py-1 rounded text-xs font-bold border border-current/30 shadow-sm",
                    colors.bgSecondary,
                    colors.accentBright
                )}>
                    {getTypeLabel()}
                </div>
            </div>

            <div className="flex items-start gap-3 mb-4 relative z-10">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/60 dark:bg-white/20 border border-current/30 shadow-sm">
                    <UserIcon />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getTypeIcon()}</span>
                        <h3 className={cn("font-semibold text-sm", colors.accentBright)}>
                            Human Input Requested
                        </h3>
                    </div>
                    <div className={cn("text-xs uppercase tracking-wide font-medium", colors.accent)}>
                        {args.type}
                    </div>
                </div>
            </div>

            {/* Main message */}
            <div className={cn(
                "rounded-lg p-4 border border-current/20 mb-3 shadow-sm",
                colors.bgSecondary,
                colors.text
            )}>
                <div className="flex items-start gap-2">
                    <MessageIcon size={16} />
                    <div className="flex-1">
                        <p className="text-sm font-medium leading-relaxed">
                            {args.message}
                        </p>
                    </div>
                </div>
            </div>

            {/* Context if provided */}
            {args.context && (
                <div className={cn(
                    "rounded-lg p-3 border border-current/10 mb-3",
                    colors.bgSecondary,
                    colors.textSecondary
                )}>
                    <div className="flex items-start gap-2">
                        <div className="text-xs mt-0.5">💡</div>
                        <div className="flex-1">
                            <p className="text-xs italic leading-relaxed">
                                Context: {args.context}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Waiting indicator */}
            <div className="flex items-center gap-2 text-xs">
                <div className={cn("w-2 h-2 rounded-full animate-pulse", "bg-current opacity-60")} />
                <span className={cn("font-medium", colors.textSecondary)}>
                    Waiting for human response...
                </span>
            </div>
        </div>
    );
} 