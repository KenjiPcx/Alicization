import { useMicroAppStore } from "@/lib/store/micro-app-store";

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