"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Settings,
    Bell,
    User,
    Building2,
    TrendingUp,
    Menu,
    X,
    Hammer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import SettingsDialog from "@/components/dialogs/settings-dialog";
import { useAppStore } from "@/lib/store/app-store";

interface SpeedDialProps {
    onUserTasksClick: () => void;
    pendingTasksCount?: number;
    className?: string;
}

export function SpeedDial({
    onUserTasksClick,
    pendingTasksCount = 0,
    className,
}: SpeedDialProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { isBuilderMode, setBuilderMode, debugMode, setDebugMode, isAnimatingCamera, setAnimatingCamera } = useAppStore();

    // Handle builder mode toggle - let the scene handle animation
    const handleBuilderModeToggle = () => {
        if (isAnimatingCamera) return; // Prevent clicks during animation

        setAnimatingCamera(true); // Start animation state
        setBuilderMode(!isBuilderMode); // This will trigger the animation in OfficeScene
        setIsOpen(false); // Close the speed dial
    };

    const speedDialItems = [
        {
            icon: Bell,
            label: "User Tasks",
            onClick: onUserTasksClick,
            badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
            color: "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white",
            component: "button" as const,
        },
        {
            icon: Hammer,
            label: "Builder Mode",
            onClick: handleBuilderModeToggle,
            color: isBuilderMode
                ? "bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white"
                : "bg-slate-500 hover:bg-slate-600 dark:bg-slate-700 dark:hover:bg-slate-800 text-white",
            component: "button" as const,
            disabled: isAnimatingCamera, // Disable during animation
        },
        {
            icon: Settings,
            label: "Settings",
            onClick: () => { },
            color: "bg-slate-600 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-900 text-white",
            component: "settings" as const,
        },
        {
            icon: User,
            label: "Profile",
            onClick: () => console.log("Profile clicked"),
            color: "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white",
            disabled: true, // Placeholder for now
            component: "button" as const,
        },
        {
            icon: Building2,
            label: "Company",
            onClick: () => console.log("Company clicked"),
            color: "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white",
            disabled: true, // Placeholder for now
            component: "button" as const,
        },
        {
            icon: TrendingUp,
            label: "Analytics",
            onClick: () => console.log("Analytics clicked"),
            color: "bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 text-white",
            disabled: true, // Placeholder for now
            component: "button" as const,
        },
    ];

    return (
        <div className={cn("fixed top-4 left-4 z-50", className)}>
            <div className="relative">
                {/* Main FAB Button */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Button
                        onClick={() => setIsOpen(!isOpen)}
                        size="icon"
                        className={cn(
                            "h-14 w-14 rounded-full shadow-lg transition-all duration-200",
                            "bg-slate-900 hover:bg-slate-800 dark:bg-black dark:hover:bg-slate-900 text-white",
                            isOpen && "rotate-45"
                        )}
                    >
                        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                </motion.div>

                {/* Notification Badge for pending tasks */}
                <AnimatePresence>
                    {pendingTasksCount > 0 && !isOpen && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-2 -right-2"
                        >
                            <Badge
                                variant="destructive"
                                className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
                            >
                                {pendingTasksCount > 99 ? "99+" : pendingTasksCount}
                            </Badge>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Speed Dial Items */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-16 left-0 space-y-3"
                        >
                            {speedDialItems.map((item, index) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, x: -20, scale: 0.8 }}
                                    animate={{
                                        opacity: 1,
                                        x: 0,
                                        scale: 1,
                                        transition: {
                                            delay: index * 0.05,
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 30
                                        }
                                    }}
                                    exit={{
                                        opacity: 0,
                                        x: -20,
                                        scale: 0.8,
                                        transition: {
                                            delay: (speedDialItems.length - 1 - index) * 0.05,
                                            duration: 0.1
                                        }
                                    }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="relative">
                                        {item.component === "settings" ? (
                                            <SettingsDialog
                                                debugMode={debugMode}
                                                toggleDebugMode={() => setDebugMode(!debugMode)}
                                                trigger={
                                                    <Button
                                                        size="icon"
                                                        disabled={item.disabled}
                                                        className={cn(
                                                            "h-12 w-12 rounded-full shadow-lg transition-all duration-200",
                                                            item.color,
                                                            item.disabled && "opacity-50 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <item.icon className="h-5 w-5" />
                                                    </Button>
                                                }
                                            />
                                        ) : (
                                            <Button
                                                onClick={() => {
                                                    if (!item.disabled) {
                                                        item.onClick();
                                                        setIsOpen(false);
                                                    }
                                                }}
                                                size="icon"
                                                disabled={item.disabled}
                                                className={cn(
                                                    "h-12 w-12 rounded-full shadow-lg transition-all duration-200",
                                                    item.color,
                                                    item.disabled && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <item.icon className="h-5 w-5" />
                                            </Button>
                                        )}

                                        {/* Item Badge */}
                                        {item.badge && (
                                            <Badge
                                                variant="destructive"
                                                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                                            >
                                                {item.badge > 99 ? "99+" : item.badge}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Label */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{
                                            opacity: 1,
                                            x: 0,
                                            transition: { delay: (index * 0.05) + 0.1 }
                                        }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="bg-background/95 backdrop-blur-sm px-3 py-1 rounded-md shadow-md border text-sm font-medium whitespace-nowrap"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{item.label}</span>
                                            {item.disabled && (
                                                <span className="text-xs text-muted-foreground">
                                                    (Coming Soon)
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
} 