'use client';

import React from 'react';
import { Brain, Sparkles, Trophy, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LearnSkillPreviewProps {
    args: {
        artifactGroupId: string;
        skillName: string;
        skillDescription: string;
    };
    toolCallId: string;
    result?: {
        success: boolean;
        message: string;
        skillId: string;
        imageUrl?: string;
    };
}

export function LearnSkillPreview({ args, toolCallId, result }: LearnSkillPreviewProps) {
    // Neon color schemes for skill acquisition
    const neonColors = {
        border: 'border-cyan-400/50 dark:border-cyan-300/50',
        bg: 'bg-gradient-to-br from-cyan-900/20 via-purple-900/20 to-pink-900/20 dark:from-cyan-800/30 dark:via-purple-800/30 dark:to-pink-800/30',
        bgSecondary: 'bg-cyan-500/10 dark:bg-cyan-400/20',
        glow: 'shadow-lg shadow-cyan-500/20 dark:shadow-cyan-400/30',
        text: 'text-cyan-100 dark:text-cyan-50',
        textSecondary: 'text-cyan-200 dark:text-cyan-100',
        accent: 'text-cyan-400 dark:text-cyan-300',
        accentBright: 'text-cyan-300 dark:text-cyan-200',
        neonGlow: 'drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]',
    };

    // If we have a result, show skill acquired state
    if (result) {
        return (
            <div className={cn(
                "border rounded-lg p-6 relative overflow-hidden",
                neonColors.border,
                neonColors.bg,
                neonColors.glow
            )}>
                {/* Animated background particles */}
                <div className="absolute inset-0">
                    <div className="absolute top-4 left-8 w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-60" />
                    <div className="absolute top-12 right-12 w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-40" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute bottom-8 left-16 w-1 h-1 bg-pink-400 rounded-full animate-pulse opacity-50" style={{ animationDelay: '1s' }} />
                    <div className="absolute bottom-16 right-8 w-1 h-1 bg-cyan-400 rounded-full animate-pulse opacity-30" style={{ animationDelay: '1.5s' }} />
                </div>

                {/* Success header */}
                <div className="flex items-center gap-4 mb-4 relative z-10">
                    <div className="relative">
                        {result.imageUrl ? (
                            <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-cyan-400/50 bg-cyan-500/20">
                                <img
                                    src={result.imageUrl}
                                    alt={args.skillName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className={cn(
                                "w-16 h-16 rounded-lg border-2 border-cyan-400/50 bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center",
                                neonColors.neonGlow
                            )}>
                                <Brain className="w-8 h-8 text-cyan-300" />
                            </div>
                        )}
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                            <Star className="w-3 h-3 text-white" />
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Trophy className={cn("w-5 h-5", neonColors.accent, neonColors.neonGlow)} />
                            <h3 className={cn("font-bold text-lg", neonColors.accentBright)}>
                                SKILL ACQUIRED!
                            </h3>
                            <Sparkles className={cn("w-4 h-4", neonColors.accent)} />
                        </div>
                        <div className={cn("text-xs uppercase tracking-wider font-medium", neonColors.accent)}>
                            Level Up • New Ability Unlocked
                        </div>
                    </div>
                </div>

                {/* Skill info */}
                <div className={cn(
                    "rounded-lg p-4 border border-cyan-400/20 mb-3 backdrop-blur-sm",
                    neonColors.bgSecondary
                )}>
                    <h4 className={cn("font-semibold text-lg mb-2", neonColors.text)}>
                        {args.skillName}
                    </h4>
                    <p className={cn("text-sm leading-relaxed", neonColors.textSecondary)}>
                        {args.skillDescription}
                    </p>
                </div>

                {/* Success message */}
                <div className={cn("text-sm", neonColors.textSecondary)}>
                    {result.message}
                </div>

                {/* XP indicator */}
                <div className="flex items-center gap-2 mt-3">
                    <Zap className={cn("w-4 h-4", neonColors.accent)} />
                    <span className={cn("text-xs font-medium", neonColors.accent)}>
                        +100 XP • Documentation Generated
                    </span>
                </div>
            </div>
        );
    }

    // Show skill learning in progress state
    return (
        <div className={cn(
            "border rounded-lg p-6 relative overflow-hidden",
            neonColors.border,
            neonColors.bg,
            neonColors.glow
        )}>
            {/* Animated scanning lines */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Header */}
            <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className={cn(
                    "w-12 h-12 rounded-lg border-2 border-cyan-400/50 bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center relative",
                    neonColors.neonGlow
                )}>
                    <Brain className="w-6 h-6 text-cyan-300 animate-pulse" />
                    <div className="absolute inset-0 rounded-lg bg-cyan-400/20 animate-ping" />
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className={cn("w-4 h-4", neonColors.accent)} />
                        <h3 className={cn("font-bold text-lg", neonColors.accentBright)}>
                            Learning New Skill
                        </h3>
                    </div>
                    <div className={cn("text-xs uppercase tracking-wider font-medium", neonColors.accent)}>
                        Neural Network Training
                    </div>
                </div>
            </div>

            {/* Skill info */}
            <div className={cn(
                "rounded-lg p-4 border border-cyan-400/20 mb-3 backdrop-blur-sm",
                neonColors.bgSecondary
            )}>
                <h4 className={cn("font-semibold text-lg mb-2", neonColors.text)}>
                    {args.skillName}
                </h4>
                <p className={cn("text-sm leading-relaxed", neonColors.textSecondary)}>
                    {args.skillDescription}
                </p>
            </div>

            {/* Progress indicators */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                    <span className={cn("text-xs", neonColors.textSecondary)}>
                        Creating skill record...
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    <span className={cn("text-xs", neonColors.textSecondary)}>
                        Generating documentation...
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }} />
                    <span className={cn("text-xs", neonColors.textSecondary)}>
                        Creating skill icon...
                    </span>
                </div>
            </div>
        </div>
    );
} 