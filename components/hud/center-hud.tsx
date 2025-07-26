"use client";

import { Card } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOfficeDataContext } from "@/providers/office-data-provider";

interface CenterHUDProps {
    className?: string;
}

export function CenterHUD({ className }: CenterHUDProps) {
    // Get the current user and company
    const { company } = useOfficeDataContext();

    // TODO: Replace with real data from your backend
    const levelStats = {
        level: 5,
        xp: 8420,
        nextLevelXp: 10000,
    };

    const xpProgress = (levelStats.xp / levelStats.nextLevelXp) * 100;
    const companyName = company?.name || "Your Company";

    return (
        <div className={cn("fixed top-4 left-1/2 transform -translate-x-1/2 z-40", className)}>
            <Card className="bg-background/95 backdrop-blur-sm border-2 border-amber-200 dark:border-amber-800 p-3">
                <div className="text-center space-y-2">
                    {/* Company Name with Level */}
                    <div className="flex items-center justify-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold text-primary">
                            {companyName}
                        </span>
                        <span className="text-sm font-medium text-amber-500">
                            - Level {levelStats.level}
                        </span>
                    </div>

                    {/* XP Progress Bar with text inside */}
                    <div className="relative w-48">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-amber-400 to-amber-600 h-full rounded-full transition-all duration-300 flex items-center justify-center"
                                style={{
                                    width: `${Math.min(100, Math.max(0, xpProgress))}%`
                                }}
                            />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                {levelStats.xp}/{levelStats.nextLevelXp} XP
                            </span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
} 