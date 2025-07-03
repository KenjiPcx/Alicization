import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Create a simple store using Zustand
interface ArtifactState {
  // Track which artifact is currently open
  toolCallId: string | null;
  isVisible: boolean;
  boundingBox: BoundingBox;

  // Metadata storage
  metadata: Record<string, any>; // artifactId -> metadata

  setCurrentArtifact: (id: string | null) => void;
  setVisible: (visible: boolean) => void;
  setBoundingBox: (boundingBox: BoundingBox) => void;
  openArtifact: (id: string, boundingBox: BoundingBox) => void;
  closeArtifact: () => void;

  // Metadata functions
  setMetadata: (artifactId: string, metadata: any) => void;
  getMetadata: (artifactId: string) => any;
  clearMetadata: (artifactId: string) => void;
  clearAllMetadata: () => void;
}

export const useArtifactStore = create<ArtifactState>()(
  persist(
    (set, get) => ({
      toolCallId: null,
      isVisible: false,
      boundingBox: {
        top: 0,
        left: 0,
        width: 0,
        height: 0,
      },
      metadata: {},

      setCurrentArtifact: (id) => set({ toolCallId: id }),
      setVisible: (visible) => set({ isVisible: visible }),
      setBoundingBox: (boundingBox) => set({ boundingBox }),

      openArtifact: (id, boundingBox) => set({
        toolCallId: id,
        isVisible: true,
        boundingBox
      }),

      closeArtifact: () => set({
        toolCallId: null,
        isVisible: false
      }),

      // Metadata functions
      setMetadata: (artifactId: string, metadata: any) =>
        set((state) => ({
          metadata: {
            ...state.metadata,
            [artifactId]: metadata,
          },
        })),

      getMetadata: (artifactId: string) => {
        const state = get();
        return state.metadata[artifactId] || null;
      },

      clearMetadata: (artifactId: string) =>
        set((state) => {
          const newMetadata = { ...state.metadata };
          delete newMetadata[artifactId];
          return { metadata: newMetadata };
        }),

      clearAllMetadata: () => set({ metadata: {} }),
    }),
    {
      name: 'artifact-storage', // localStorage key
      // Only persist metadata, not UI state
      partialize: (state) => ({ metadata: state.metadata }),
    }
  )
);

export function useArtifact() {
  const toolCallId = useArtifactStore((state) => state.toolCallId);
  const isVisible = useArtifactStore((state) => state.isVisible);
  const boundingBox = useArtifactStore((state) => state.boundingBox);
  const setCurrentArtifact = useArtifactStore((state) => state.setCurrentArtifact);
  const setVisible = useArtifactStore((state) => state.setVisible);
  const setBoundingBox = useArtifactStore((state) => state.setBoundingBox);
  const openArtifact = useArtifactStore((state) => state.openArtifact);
  const closeArtifact = useArtifactStore((state) => state.closeArtifact);

  // Metadata functions
  const setMetadata = useArtifactStore((state) => state.setMetadata);
  const getMetadata = useArtifactStore((state) => state.getMetadata);
  const clearMetadata = useArtifactStore((state) => state.clearMetadata);

  // Get metadata for the current artifact (if artifactId is provided)
  const localArtifactMetadata = useArtifactStore((state) =>
    toolCallId ? state.metadata[toolCallId] || null : null
  );

  // Convenience function to set metadata for the current artifact
  const setLocalArtifactMetadata = (metadata: any) => {
    if (toolCallId) {
      setMetadata(toolCallId, metadata);
    }
  };

  return {
    toolCallId,
    isVisible,
    boundingBox,
    setCurrentArtifact,
    setVisible,
    setBoundingBox,
    openArtifact,
    closeArtifact,

    // Metadata for current artifact
    localArtifactMetadata,
    setLocalArtifactMetadata,

    // Generic metadata functions
    setMetadata,
    getMetadata,
    clearMetadata,
  };
}