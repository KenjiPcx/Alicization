"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import OfficeSimulation from "@/components/office-simulation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { OnboardingModal } from '@/components/onboarding/onboarding-modal';
import { useOnboarding } from '@/hooks/use-onboarding';
import { OfficeMenu } from "@/components/hud/office-menu";
import { StatsHUD } from "@/components/hud/stats-hud";
import { CenterHUD } from "@/components/hud/center-hud";
import { UserTasksModal } from "@/components/hud/user-tasks-modal";
import { useAppStore } from "@/lib/store/app-store";
import { OfficeDataProvider } from "@/providers/office-data-provider";
import { LoginPage } from "@/components/auth/login-page";

export default function HomePage() {

  return (
    <main className="w-[100dvw] h-[100dvh] relative">
      <Authenticated>
        <Content />
      </Authenticated>
      <Unauthenticated>
        <LoginPage />
      </Unauthenticated>
    </main>
  );
}

function Content() {
  // const { showOnboarding, isLoadingStatus } = useOnboarding();
  const { isUserTasksModalOpen, setIsUserTasksModalOpen } = useAppStore();

  // Get the current user and their pending tasks count
  // const user = useQuery(api.auth.currentUser);
  // const pendingTasks = useQuery(api.userTasks.getAllPendingUserTasks,
  //   user?._id ? { userId: user._id } : "skip"
  // );

  return (
    <OfficeDataProvider>
      <SidebarProvider defaultOpen={false}>
        <SidebarInset>
          <OfficeSimulation />
        </SidebarInset>
      </SidebarProvider>

      {/* Game-like HUD Components */}
      <OfficeMenu
        onUserTasksClick={() => setIsUserTasksModalOpen(true)}
        pendingTasksCount={0}
      />

      <StatsHUD />

      <CenterHUD />

      {/* Modals */}
      <UserTasksModal
        isOpen={isUserTasksModalOpen}
        onOpenChange={setIsUserTasksModalOpen}
      />

      {/* Only show onboarding modal when status is loaded */}
      {/* {!isLoadingStatus && (
          <OnboardingModal
            open={showOnboarding}
          />
        )} */}
    </OfficeDataProvider>
  );
}