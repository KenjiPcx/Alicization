"use client";

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface AppState {
    // Hydration state
    _hasHydrated: boolean;
    setHasHydrated: (hasHydrated: boolean) => void;

    // Global modal state
    isChatModalOpen: boolean;
    setIsChatModalOpen: (isOpen: boolean) => void;

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

        userMetadata: null,
        setUserMetadata: (userMetadata) => set({ userMetadata }),
    }))
);

// Set hydrated to true after the store is created (client-side only)
if (typeof window !== 'undefined') {
    useAppStore.getState().setHasHydrated(true);
}
