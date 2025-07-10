"use client";

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Id } from '@/convex/_generated/dataModel';

interface OfficeState {
  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;

  // Current selections (office-specific) - store both employee and team IDs
  activeChatParticipant: {
    type: 'employee' | 'team';
    employeeId: Id<"employees">;
    teamId: Id<"teams">;
  } | null;
  setActiveChatParticipant: (participant: {
    type: 'employee' | 'team';
    employeeId: Id<"employees">;
    teamId: Id<"teams">;
  } | null) => void;

  // Office scene state
  debugMode: boolean;
  toggleDebugMode: () => void;
}

export const useOfficeStore = create<OfficeState>()(
  subscribeWithSelector((set) => ({
    _hasHydrated: false,
    setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),

    activeChatParticipant: null,
    setActiveChatParticipant: (participant) => set({ activeChatParticipant: participant }),

    debugMode: false,
    toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode })),
  }))
);

// Set hydrated to true after the store is created (client-side only)
if (typeof window !== 'undefined') {
  useOfficeStore.getState().setHasHydrated(true);
}
