"use client";

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { EmployeeData, TeamData } from '@/lib/types';

interface OfficeState {
  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;

  // Current selections (office-specific)
  activeParticipant: { type: 'employee', data: EmployeeData }
  | { type: 'team', data: TeamData }
  | null;
  setActiveParticipant: (participant: { type: 'employee', data: EmployeeData }
    | { type: 'team', data: TeamData }
    | null) => void;

  // Office scene state
  debugMode: boolean;
  toggleDebugMode: () => void;
}

export const useOfficeStore = create<OfficeState>()(
  subscribeWithSelector((set) => ({
    _hasHydrated: false,
    setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),

    activeParticipant: null,
    setActiveParticipant: (participant) => set({ activeParticipant: participant }),

    debugMode: false,
    toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode })),
  }))
);

// Set hydrated to true after the store is created (client-side only)
if (typeof window !== 'undefined') {
  useOfficeStore.getState().setHasHydrated(true);
}
