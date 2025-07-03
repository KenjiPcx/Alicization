"use client";

import { create } from 'zustand';
import type { EmployeeData, TeamData } from '@/lib/types';

interface OfficeState {
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

export const useOfficeStore = create<OfficeState>((set) => ({
  activeParticipant: null,
  setActiveParticipant: (participant) => set({ activeParticipant: participant }),

  debugMode: false,
  toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode })),
}));
