import { Id } from '@/convex/_generated/dataModel';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BoundingBox {
    top: number;
    left: number;
    width: number;
    height: number;
}

export interface MicroAppData {
    title: string;
    microAppType: string;
    toolCallId?: string;
    employeeId?: Id<"employees">;
    teamId?: Id<"teams">;
    companyId?: Id<"companies">;
}

// Create a simple store using Zustand
interface MicroAppState {
    // Track which micro UI is currently open
    toolCallId: string | null;
    isVisible: boolean;
    boundingBox: BoundingBox;

    // Track the type of micro UI (artifact vs office)
    microAppType: 'artifact' | 'office' | null;
    microAppData: MicroAppData | null; // For office micro apps

    // Metadata storage
    metadata: Record<string, any>; // microAppId -> metadata

    setCurrentMicroApp: (id: string | null) => void;
    setVisible: (visible: boolean) => void;
    setBoundingBox: (boundingBox: BoundingBox) => void;
    openArtifactMicroApp: (id: string, boundingBox: BoundingBox) => void;
    openOfficeMicroApp: (id: string, boundingBox: BoundingBox, data: MicroAppData) => void;
    closeMicroApp: () => void;

    // Metadata functions
    setMetadata: (microAppId: string, metadata: any) => void;
    getMetadata: (microAppId: string) => any;
    clearMetadata: (microAppId: string) => void;
    clearAllMetadata: () => void;
}
export const useMicroAppStore = create<MicroAppState>()(
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
            microAppType: null,
            microAppData: null,
            metadata: {},

            setCurrentMicroApp: (id) => set({ toolCallId: id }),
            setVisible: (visible) => set({ isVisible: visible }),
            setBoundingBox: (boundingBox) => set({ boundingBox }),

            openArtifactMicroApp: (id, boundingBox) => set({
                toolCallId: id,
                isVisible: true,
                boundingBox,
                microAppType: 'artifact',
                microAppData: null,
            }),

            openOfficeMicroApp: (id, boundingBox, data) => set({
                toolCallId: id,
                isVisible: true,
                boundingBox,
                microAppType: 'office',
                microAppData: data
            }),

            closeMicroApp: () => set({
                toolCallId: null,
                isVisible: false,
                microAppType: null,
                microAppData: null,
            }),

            // Metadata functions
            setMetadata: (microAppId: string, metadata: any) =>
                set((state) => ({
                    metadata: {
                        ...state.metadata,
                        [microAppId]: metadata,
                    },
                })),

            getMetadata: (microAppId: string) => {
                const state = get();
                return state.metadata[microAppId] || null;
            },

            clearMetadata: (microAppId: string) =>
                set((state) => {
                    const newMetadata = { ...state.metadata };
                    delete newMetadata[microAppId];
                    return { metadata: newMetadata };
                }),

            clearAllMetadata: () => set({ metadata: {} }),
        }),
        {
            name: 'micro-ui-storage', // localStorage key
            // Only persist metadata, not UI state
            partialize: (state) => ({ metadata: state.metadata }),
        }
    )
);

export function useMicroApp() {
    const toolCallId = useMicroAppStore((state) => state.toolCallId);
    const isVisible = useMicroAppStore((state) => state.isVisible);
    const boundingBox = useMicroAppStore((state) => state.boundingBox);
    const microAppType = useMicroAppStore((state) => state.microAppType);
    const microAppData = useMicroAppStore((state) => state.microAppData);
    const setCurrentMicroApp = useMicroAppStore((state) => state.setCurrentMicroApp);
    const setVisible = useMicroAppStore((state) => state.setVisible);
    const setBoundingBox = useMicroAppStore((state) => state.setBoundingBox);
    const openArtifactMicroApp = useMicroAppStore((state) => state.openArtifactMicroApp);
    const openOfficeMicroApp = useMicroAppStore((state) => state.openOfficeMicroApp);
    const closeMicroApp = useMicroAppStore((state) => state.closeMicroApp);

    // Metadata functions
    const setMetadata = useMicroAppStore((state) => state.setMetadata);
    const getMetadata = useMicroAppStore((state) => state.getMetadata);
    const clearMetadata = useMicroAppStore((state) => state.clearMetadata);

    // Get metadata for the current micro UI (if microAppId is provided)
    const localMicroAppMetadata = useMicroAppStore((state) =>
        toolCallId ? state.metadata[toolCallId] || null : null
    );

    // Convenience function to set metadata for the current micro UI
    const setLocalMicroAppMetadata = (metadata: any) => {
        if (toolCallId) {
            setMetadata(toolCallId, metadata);
        }
    };

    return {
        toolCallId,
        isVisible,
        boundingBox,
        microAppType,
        microAppData,
        setCurrentMicroApp,
        setVisible,
        setBoundingBox,
        openArtifactMicroApp,
        openOfficeMicroApp,
        closeMicroApp,

        // Metadata for current micro UI
        localMicroAppMetadata,
        setLocalMicroAppMetadata,

        // Generic metadata functions
        setMetadata,
        getMetadata,
        clearMetadata,
    };
}