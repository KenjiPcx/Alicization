"use client";

import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import OfficeSimulation from "@/components/office-simulation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { OnboardingModal } from '@/components/onboarding/onboarding-modal';
import { useOnboarding } from '@/hooks/use-onboarding';
import { SpeedDial } from "@/components/hud/speed-dial";
import { StatsHUD } from "@/components/hud/stats-hud";
import { CenterHUD } from "@/components/hud/center-hud";
import { UserTasksModal } from "@/components/hud/user-tasks-modal";
import SettingsDialog from "@/components/dialogs/settings-dialog";

export default function HomePage() {
  const { showOnboarding, isLoadingStatus } = useOnboarding();
  const [isUserTasksModalOpen, setIsUserTasksModalOpen] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const toggleDebugMode = () => setDebugMode(!debugMode);

  // Get the current user and their pending tasks count
  const user = useQuery(api.auth.currentUser);
  const pendingTasks = useQuery(api.userTasks.getAllPendingUserTasks,
    user?._id ? { userId: user._id } : "skip"
  );

  return (
    <main className="w-[100dvw] h-[100dvh] relative">
      <SidebarProvider defaultOpen={false}>
        <SidebarInset>
          <OfficeSimulation debugMode={debugMode} />
        </SidebarInset>
      </SidebarProvider>

      {/* Game-like HUD Components */}
      <SpeedDial
        onUserTasksClick={() => setIsUserTasksModalOpen(true)}
        pendingTasksCount={pendingTasks?.length || 0}
        debugMode={debugMode}
        toggleDebugMode={toggleDebugMode}
      />

      <StatsHUD />

      <CenterHUD />

      {/* Modals */}
      <UserTasksModal
        isOpen={isUserTasksModalOpen}
        onOpenChange={setIsUserTasksModalOpen}
      />

      {/* Only show onboarding modal when status is loaded */}
      {!isLoadingStatus && (
        <OnboardingModal
          open={showOnboarding}
        />
      )}
    </main>
  );
}
