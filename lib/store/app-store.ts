"use client";

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Id } from '@/convex/_generated/dataModel';

interface AppState {
    // Hydration state
    _hasHydrated: boolean;
    setHasHydrated: (hasHydrated: boolean) => void;

    // Global modal state
    isChatModalOpen: boolean;
    setIsChatModalOpen: (isOpen: boolean) => void;

    isUserTasksModalOpen: boolean;
    setIsUserTasksModalOpen: (isOpen: boolean) => void;

    // Chat participant selection (closely related to isChatModalOpen)
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

    // App settings
    debugMode: boolean;
    setDebugMode: (debugMode: boolean) => void;

    // Builder mode state
    isBuilderMode: boolean;
    setBuilderMode: (isBuilderMode: boolean) => void;

    // Dragging state for locking orbit controls
    isDragging: boolean;
    setIsDragging: (isDragging: boolean) => void;

    // Camera animation state
    isAnimatingCamera: boolean;
    setAnimatingCamera: (isAnimating: boolean) => void;

    // Grid display settings (prevent duplicate grids)
    gridDisplayMode: 'none' | 'debug' | 'builder' | 'both';
    setGridDisplayMode: (mode: 'none' | 'debug' | 'builder' | 'both') => void;

    // Global user state
    userMetadata: {
        userType: 'regular' | 'pro';
    } | null;
    setUserMetadata: (userMetadata: { userType: 'regular' | 'pro' }) => void;
}

export const useAppStore = create<AppState>()(
    subscribeWithSelector((set) => ({
        _hasHydrated: false,
        setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),

        isChatModalOpen: false,
        setIsChatModalOpen: (isOpen: boolean) => set({ isChatModalOpen: isOpen }),

        isUserTasksModalOpen: false,
        setIsUserTasksModalOpen: (isOpen: boolean) => set({ isUserTasksModalOpen: isOpen }),

        activeChatParticipant: null,
        setActiveChatParticipant: (participant) => set({ activeChatParticipant: participant }),

        debugMode: false,
        setDebugMode: (debugMode: boolean) => set({ debugMode }),

        isBuilderMode: false,
        setBuilderMode: (isBuilderMode: boolean) => set({ isBuilderMode }),

        isDragging: false,
        setIsDragging: (isDragging: boolean) => set({ isDragging }),

        isAnimatingCamera: false,
        setAnimatingCamera: (isAnimating: boolean) => set({ isAnimatingCamera: isAnimating }),

        gridDisplayMode: 'none',
        setGridDisplayMode: (mode: 'none' | 'debug' | 'builder' | 'both') => set({ gridDisplayMode: mode }),

        userMetadata: null,
        setUserMetadata: (userMetadata) => set({ userMetadata }),
    }))
);

// Set hydrated to true after the store is created (client-side only)
if (typeof window !== 'undefined') {
    useAppStore.getState().setHasHydrated(true);
}
