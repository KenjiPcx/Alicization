"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    DollarSign,
    Activity,
    TrendingUp,
    Clock,
    Zap,
    Target,
    Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface StatsHUDProps {
    className?: string;
}

export function StatsHUD({ className }: StatsHUDProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // TODO: Replace with real data from your backend
    const stats = {
        activeAgents: 12,
        totalAgents: 15,
        moneyMadeToday: 2540,
        activeTasks: 8,
        completedTasksToday: 23,
        efficiency: 87,
        uptime: "99.2%",
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getEfficiencyColor = (efficiency: number) => {
        if (efficiency >= 90) return "text-green-500";
        if (efficiency >= 75) return "text-yellow-500";
        return "text-red-500";
    };

    // Compact view items - 6 items in 3x2 grid
    const compactStats = [
        {
            icon: Users,
            value: `${stats.activeAgents}`,
            color: "text-blue-500",
        },
        {
            icon: DollarSign,
            value: formatCurrency(stats.moneyMadeToday),
            color: "text-green-500",
        },
        {
            icon: Activity,
            value: `${stats.activeTasks}`,
            color: "text-purple-500",
        },
        {
            icon: Target,
            value: `${stats.completedTasksToday}`,
            color: "text-orange-500",
        },
        {
            icon: Zap,
            value: `${stats.efficiency}%`,
            color: getEfficiencyColor(stats.efficiency),
        },
        {
            icon: Clock,
            value: stats.uptime,
            color: "text-green-500",
        },
    ];

    // Full expanded view items
    const expandedStatItems = [
        {
            icon: Users,
            label: "Agents",
            value: `${stats.activeAgents}/${stats.totalAgents}`,
            subLabel: "Online",
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
        },
        {
            icon: DollarSign,
            label: "Today",
            value: formatCurrency(stats.moneyMadeToday),
            subLabel: "Revenue",
            color: "text-green-500",
            bgColor: "bg-green-500/10",
        },
        {
            icon: Activity,
            label: "Tasks",
            value: `${stats.activeTasks}`,
            subLabel: "Active",
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
        },
        {
            icon: Target,
            label: "Completed",
            value: `${stats.completedTasksToday}`,
            subLabel: "Today",
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
        },
    ];

    return (
        <div className={cn("fixed top-4 right-4 z-40", className)}>
            <motion.div
                onHoverStart={() => setIsExpanded(true)}
                onHoverEnd={() => setIsExpanded(false)}
                className="relative"
            >
                <AnimatePresence mode="wait">
                    {!isExpanded ? (
                        // Compact View - 3x2 grid, no labels
                        <motion.div
                            key="compact"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="p-2 bg-background/95 backdrop-blur-sm border-2 border-primary/20 cursor-pointer">
                                <div className="grid grid-cols-3 gap-2">
                                    {compactStats.map((stat, index) => (
                                        <div key={index} className="flex items-center justify-center gap-1">
                                            <stat.icon className={cn("h-3 w-3", stat.color)} />
                                            <span className={cn("text-xs font-bold", stat.color)}>
                                                {stat.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </motion.div>
                    ) : (
                        // Expanded View
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3"
                        >
                            {/* Main Stats Grid */}
                            <Card className="p-4 bg-background/95 backdrop-blur-sm border-2 border-primary/20">
                                <div className="grid grid-cols-2 gap-3">
                                    {expandedStatItems.map((stat, index) => (
                                        <div
                                            key={stat.label}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded-lg",
                                                stat.bgColor
                                            )}
                                        >
                                            <div className={cn("p-1 rounded-md", stat.color)}>
                                                <stat.icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={cn("text-sm font-bold", stat.color)}>
                                                    {stat.value}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {stat.subLabel}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Performance Indicators */}
                            <Card className="p-3 bg-background/95 backdrop-blur-sm border border-primary/20">
                                <div className="space-y-2">
                                    {/* Efficiency */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-3 w-3 text-yellow-500" />
                                            <span className="text-xs font-medium">Efficiency</span>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={cn("text-xs", getEfficiencyColor(stats.efficiency))}
                                        >
                                            {stats.efficiency}%
                                        </Badge>
                                    </div>

                                    {/* Uptime */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3 text-green-500" />
                                            <span className="text-xs font-medium">Uptime</span>
                                        </div>
                                        <Badge variant="outline" className="text-xs text-green-500">
                                            {stats.uptime}
                                        </Badge>
                                    </div>
                                </div>
                            </Card>

                            {/* Status Indicator */}
                            <div className="flex justify-end">
                                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-xs font-medium text-green-500">
                                        System Online
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
} 