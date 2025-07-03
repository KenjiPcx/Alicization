"use client";

import { create, type StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';

type ScrollFlag = ScrollBehavior | false;

interface ChatState {
  // Chat session state
  threadId: string | null;
  setThreadId: (id: string | null) => void;

  // Chat UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentMode: 'Chat' | 'Files' | 'Config';
  setCurrentMode: (mode: 'Chat' | 'Files' | 'Config') => void;

  // Chat-specific file viewer
  fileViewerOpen: boolean;
  setFileViewerOpen: (open: boolean) => void;
  fileViewerUrl: string;
  setFileViewerUrl: (url: string) => void;
  fileViewerTitle: string;
  setFileViewerTitle: (title: string) => void;

  // Scroll state (chat-specific)
  isAtBottom: boolean;
  setIsAtBottom: (isAtBottom: boolean) => void;
  scrollBehavior: ScrollFlag;
  setScrollBehavior: (behavior: ScrollFlag) => void;

  // Chat settings
  modelId: string;
  initialVisibilityType: 'private' | 'public';
  isSidebarCollapsed: boolean;
  setModelId: (modelId: string) => void;
  setInitialVisibilityType: (initialVisibilityType: 'private' | 'public') => void;
  setIsSidebarCollapsed: (isSidebarCollapsed: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      threadId: null,
      setThreadId: (id: string | null) => set({ threadId: id }),

      sidebarOpen: true,
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

      fileViewerOpen: false,
      setFileViewerOpen: (open: boolean) => set({ fileViewerOpen: open }),
      fileViewerUrl: '',
      setFileViewerUrl: (url: string) => set({ fileViewerUrl: url }),
      fileViewerTitle: '',
      setFileViewerTitle: (title: string) => set({ fileViewerTitle: title }),

      currentMode: 'Chat',
      setCurrentMode: (mode: 'Chat' | 'Files' | 'Config') => set({ currentMode: mode }),

      // Scroll state
      isAtBottom: false,
      setIsAtBottom: (isAtBottom: boolean) => set({ isAtBottom }),
      scrollBehavior: false,
      setScrollBehavior: (behavior: ScrollFlag) => set({ scrollBehavior: behavior }),

      // Chat settings (with defaults)
      modelId: 'chat-model',
      initialVisibilityType: 'private',
      isSidebarCollapsed: false,
      setModelId: (modelId) => set({ modelId }),
      setInitialVisibilityType: (initialVisibilityType) => set({ initialVisibilityType }),
      setIsSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
    }),
    {
      name: 'chat-store', // localStorage key
      // Only persist settings that should survive page reloads
      partialize: (state) => ({
        modelId: state.modelId,
        initialVisibilityType: state.initialVisibilityType,
        isSidebarCollapsed: state.isSidebarCollapsed,
        sidebarOpen: state.sidebarOpen,
        currentMode: state.currentMode,
      }),
    }
  )
);
