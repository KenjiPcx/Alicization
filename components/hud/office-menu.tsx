"use client";

import { useMemo } from "react";
import {
    Settings,
    Bell,
    User,
    Building2,
    TrendingUp,
    Menu,
    Hammer
} from "lucide-react";
import { SpeedDial, type SpeedDialItem } from "@/components/ui/speed-dial";
import SettingsDialog from "@/components/dialogs/settings-dialog";
import { useAppStore } from "@/lib/store/app-store";

interface SpeedDialProps {
    onUserTasksClick: () => void;
    pendingTasksCount?: number;
    className?: string;
}

export function OfficeMenu({
    onUserTasksClick,
    pendingTasksCount = 0,
    className,
}: SpeedDialProps) {
    const { isBuilderMode, setBuilderMode, debugMode, setDebugMode, isAnimatingCamera, setAnimatingCamera } = useAppStore();

    // Handle builder mode toggle - let the scene handle animation
    const handleBuilderModeToggle = () => {
        if (isAnimatingCamera) return; // Prevent clicks during animation

        setAnimatingCamera(true); // Start animation state
        setBuilderMode(!isBuilderMode); // This will trigger the animation in OfficeScene
    };

    const speedDialItems: SpeedDialItem[] = useMemo(() => [
        {
            id: "user-tasks",
            icon: Bell,
            label: "User Tasks",
            onClick: onUserTasksClick,
            badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
            color: "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
        },
        {
            id: "builder-mode",
            icon: Hammer,
            label: "Builder Mode",
            onClick: handleBuilderModeToggle,
            color: "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
            disabled: isAnimatingCamera, // Disable during animation
        },
        {
            id: "settings",
            icon: Settings,
            label: "Settings",
            onClick: () => { },
            color: "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
            component: (
                <SettingsDialog
                    debugMode={debugMode}
                    toggleDebugMode={() => setDebugMode(!debugMode)}
                    trigger={
                        <button className="h-12 w-12 rounded-full shadow-lg transition-all duration-200 bg-secondary hover:bg-secondary/80 text-secondary-foreground flex items-center justify-center">
                            <Settings className="h-5 w-5" />
                        </button>
                    }
                />
            ),
        },
        {
            id: "profile",
            icon: User,
            label: "Profile",
            onClick: () => console.log("Profile clicked"),
            color: "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
            disabled: true, // Placeholder for now
        },
        {
            id: "company",
            icon: Building2,
            label: "Company",
            onClick: () => console.log("Company clicked"),
            color: "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
            disabled: true, // Placeholder for now
        },
        {
            id: "analytics",
            icon: TrendingUp,
            label: "Analytics",
            onClick: () => console.log("Analytics clicked"),
            color: "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
            disabled: true, // Placeholder for now
        },
    ], [onUserTasksClick, pendingTasksCount, isBuilderMode, isAnimatingCamera, handleBuilderModeToggle, debugMode, setDebugMode]);

    return (
        <SpeedDial
            items={speedDialItems}
            position="top-left"
            direction="vertical"
            triggerIcon={Menu}
            triggerColor="bg-accent hover:bg-accent/90 text-accent-foreground"
            className={className}
        />
    );
} 