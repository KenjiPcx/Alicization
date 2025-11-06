"use client";

import { useMemo } from "react";
import { SpeedDial, type SpeedDialItem } from "@/components/ui/speed-dial";
import { useMicroApp } from "@/lib/store/micro-app-store";
import { useAppStore } from "@/lib/store/app-store";
// import { getAvailableApps } from "@/archive/tools/advanced/office-micro-app";
import type { Id } from "@/convex/_generated/dataModel";
import {
    BarChart3,
    Building2,
    User,
    FolderOpen,
    Settings,
    Users,
    Grid3X3,
} from "lucide-react";

interface MicroAppsSpeedDialProps {
    mainParticipantId: Id<"employees">;
    chatId: string;
    className?: string;
}

// Icon mapping for micro app types
const microAppIcons = {
    "kpi-dashboard": BarChart3,
    "company-config": Building2,
    "employee-config": User,
    "employee-drive": FolderOpen,
    "company-toolset-config": Settings,
    "employee-directory-config": Users,
} as const;

// Consistent secondary color for all micro app buttons
const microAppColor = "bg-secondary hover:bg-secondary/80 text-secondary-foreground";

// Label mapping for micro app types
const microAppLabels = {
    "kpi-dashboard": "KPI Dashboard",
    "company-config": "Company Config",
    "employee-config": "Employee Profile",
    "employee-drive": "Employee Drive",
    "company-toolset-config": "Toolset Config",
    "employee-directory-config": "Employee Directory",
} as const;

export function MicroAppsSpeedDial({
    chatId,
    className,
}: MicroAppsSpeedDialProps) {
    const { openOfficeMicroApp } = useMicroApp();
    const { activeChatParticipant } = useAppStore();

    // Get available micro apps based on employee role from app store
    // const availableApps = useMemo(() => {
    //     if (!activeChatParticipant?.builtInRole) return [];
    //     return getAvailableApps(activeChatParticipant.builtInRole as any);
    // }, [activeChatParticipant?.builtInRole]);

    // // Create speed dial items from available micro apps
    // const speedDialItems: SpeedDialItem[] = useMemo(() => {
    //     return availableApps.map((appType) => {
    //         const Icon = microAppIcons[appType];
    //         const label = microAppLabels[appType];

    //         return {
    //             id: appType,
    //             icon: Icon,
    //             label,
    //             color: microAppColor,
    //             onClick: () => {
    //                 // Calculate bounding box for micro app positioning
    //                 const boundingBox = {
    //                     top: 100,
    //                     left: 50,
    //                     width: window.innerWidth - 100,
    //                     height: window.innerHeight - 200,
    //                 };

    //                 // Open the micro app
    //                 openOfficeMicroApp(
    //                     `micro-app-${appType}-${Date.now()}`, // unique ID
    //                     boundingBox,
    //                     {
    //                         microAppType: appType,
    //                         title: label,
    //                         companyId: activeChatParticipant?.companyId,
    //                         teamId: activeChatParticipant?.teamId,
    //                         employeeId: activeChatParticipant?.employeeId,
    //                     }
    //                 );
    //             },
    //         };
    //     });
    // }, [availableApps, chatId, openOfficeMicroApp]);

    // Don't render if no apps available or chat participant not loaded
    // if (!activeChatParticipant?.builtInRole || speedDialItems.length === 0) {
    //     return null;
    // }

    return (
        <SpeedDial
            items={[]}
            position="bottom-right"
            direction="vertical"
            triggerIcon={Grid3X3}
            triggerColor="bg-accent hover:bg-accent/90 text-accent-foreground"
            positioning="absolute"
            className={`bottom-[5%] right-[5%] ${className || ''}`}
        />
    );
} 