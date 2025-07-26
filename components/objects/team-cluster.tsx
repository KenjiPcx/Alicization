import { useState, useRef, useEffect } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import type { TeamData, DeskLayoutData } from '@/lib/types';
import Desk from './desk';
import { DraggableObjectWrapper } from './draggable-object';
import { useDragDrop } from '@/hooks/use-drag-drop';
import { useAppStore } from '@/lib/store/app-store';

interface TeamClusterProps {
    team: TeamData;
    desks: DeskLayoutData[];
    handleTeamClick: (team: TeamData) => void;
    objectId: Id<"officeObjects">;
    position?: [number, number, number];
    rotation?: [number, number, number];
    companyId?: Id<"companies">;
}

export default function TeamCluster({
    team,
    desks,
    handleTeamClick,
    objectId,
    position,
    rotation,
    companyId,
}: TeamClusterProps) {
    // State for hover is localized here
    const [isHovered, setIsHovered] = useState(false);
    const lastDragTime = useRef(0);
    const wasJustDragging = useRef(false);

    // Get drag enabled state from app store
    const { isBuilderMode } = useAppStore();
    const isDragEnabled = isBuilderMode && !!companyId;

    // Access drag state to prevent clicks during drag operations
    const { dragState } = useDragDrop(isDragEnabled);

    // Track when this specific object finishes dragging
    useEffect(() => {
        const isThisObjectDragging = dragState.draggedObject?.objectId === objectId;

        if (wasJustDragging.current && !isThisObjectDragging) {
            // Just finished dragging this object
            lastDragTime.current = Date.now();
        }

        wasJustDragging.current = isThisObjectDragging;
    }, [dragState.draggedObject, team._id, objectId]);

    // Handle cluster click with enhanced drag detection
    const handleClusterClick = (event: any) => {
        event.stopPropagation();

        // Don't trigger if we're currently dragging any object
        if (dragState.isDragging) {
            return;
        }

        // Don't trigger if this specific object was recently dragged
        const now = Date.now();
        const timeSinceLastDrag = now - lastDragTime.current;
        if (timeSinceLastDrag < 200) { // 200ms grace period
            return;
        }

        // Only allow clicks when not in drag mode or when companyId is not available
        if (!isDragEnabled || !companyId) {
            handleTeamClick(team);
        }
    };

    // Only enable local hover effects when drag mode is disabled or companyId is not available
    const shouldEnableLocalHover = !isDragEnabled || !companyId;

    return (
        <DraggableObjectWrapper
            objectType="team-cluster"
            objectId={objectId}
            showHoverEffect={true}
            companyId={companyId}
            initialPosition={position}
            initialRotation={rotation}
        >
            <group
                onPointerEnter={shouldEnableLocalHover ? () => setIsHovered(true) : undefined}
                onPointerLeave={shouldEnableLocalHover ? () => setIsHovered(false) : undefined}
                onClick={handleClusterClick}
            >
                {desks.map((desk) => (
                    <Desk
                        key={desk.id}
                        deskId={desk.id}
                        position={desk.position}
                        rotationY={desk.rotationY}
                        isHovered={shouldEnableLocalHover ? isHovered : false}
                    />
                ))}
            </group>
        </DraggableObjectWrapper>
    );
} 