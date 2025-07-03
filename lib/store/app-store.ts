"use client";

import { create } from 'zustand';

interface AppState {
    // Global modal state
    isChatModalOpen: boolean;
    setIsChatModalOpen: (isOpen: boolean) => void;

    // Global user state
    userMetadata: {
        userType: 'regular' | 'pro';
    } | null;
    setUserMetadata: (userMetadata: { userType: 'regular' | 'pro' }) => void;
}

export const useAppStore = create<AppState>((set) => ({
    isChatModalOpen: false,
    setIsChatModalOpen: (isOpen: boolean) => set({ isChatModalOpen: isOpen }),

    userMetadata: null,
    setUserMetadata: (userMetadata) => set({ userMetadata }),
}));
