import { useState, useEffect, useCallback, useRef } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import * as THREE from 'three';
import { api } from '@/convex/_generated/api';
import type { TeamData, DeskLayoutData } from '@/lib/types';
import Desk from './desk';
import { DraggableObjectWrapper } from './draggable-object';
import { useDragDrop } from '@/hooks/use-drag-drop';

interface TeamClusterProps {
    team: TeamData;
    desks: DeskLayoutData[];
    handleTeamClick: (team: TeamData) => void;
    companyId?: Id<"companies">;
    isDragEnabled?: boolean;
}

export default function TeamCluster({
    team,
    desks,
    handleTeamClick,
    companyId,
    isDragEnabled = true
}: TeamClusterProps) {
    // State for hover is localized here
    const [isHovered, setIsHovered] = useState(false);
    const [officeObjectId, setOfficeObjectId] = useState<Id<"officeObjects"> | null>(null);
    const lastDragTime = useRef(0);

    // Mutations
    const getOrCreateOfficeObject = useMutation(api.officeObjects.getOrCreateOfficeObject);
    const updateOfficeObjectPosition = useMutation(api.officeObjects.updateOfficeObjectPosition);

    // Access drag state to prevent clicks during drag operations
    const { dragState } = useDragDrop(isDragEnabled);

    // Initialize office object on mount
    useEffect(() => {
        if (companyId && !officeObjectId) {
            const defaultPosition = team.clusterPosition || [0, 0, 0];

            getOrCreateOfficeObject({
                companyId,
                meshType: 'team-cluster',
                identifier: `team-${team._id}`,
                defaultPosition,
                defaultRotation: [0, 0, 0],
                metadata: {
                    teamId: team._id,
                },
            }).then(id => {
                setOfficeObjectId(id);
            }).catch(error => {
                console.error('Failed to initialize team cluster:', error);
            });
        }
    }, [companyId, team._id, team.clusterPosition, officeObjectId, getOrCreateOfficeObject]);

    // Handle drag end - save new position to database
    const handleDragEnd = useCallback(async (newPosition: THREE.Vector3) => {
        if (!officeObjectId) {
            console.warn('No office object ID available for team cluster');
            return;
        }

        // Record when drag ended to prevent immediate clicks
        lastDragTime.current = performance.now();

        try {
            await updateOfficeObjectPosition({
                id: officeObjectId,
                position: [newPosition.x, newPosition.y, newPosition.z],
            });
            console.log(`Updated team ${team.name} position to:`, newPosition);
        } catch (error) {
            console.error('Failed to update team cluster position:', error);
        }
    }, [officeObjectId, team.name, updateOfficeObjectPosition]);

    // Enhanced click handler that prevents clicks during/after drag operations
    const handleSafeTeamClick = useCallback((event: any) => {
        event.stopPropagation();

        // Prevent clicks if we're currently dragging any object
        if (dragState.isDragging) {
            return;
        }

        // Prevent clicks shortly after drag operations to avoid accidental clicks
        const timeSinceLastDrag = performance.now() - lastDragTime.current;
        if (timeSinceLastDrag < 200) { // 200ms grace period
            return;
        }

        // Only allow clicks when not in drag mode or when companyId is not available
        if (!isDragEnabled || !officeObjectId || !companyId) {
            handleTeamClick(team);
        }
    }, [dragState.isDragging, isDragEnabled, officeObjectId, companyId, team, handleTeamClick]);

    // Use team's clusterPosition for initial positioning
    const initialPosition = team.clusterPosition
        ? new THREE.Vector3(team.clusterPosition[0], team.clusterPosition[1], team.clusterPosition[2])
        : undefined;

    // Only enable local hover effects when drag mode is disabled or companyId is not available
    const shouldEnableLocalHover = !isDragEnabled || !officeObjectId || !companyId;

    return (
        <DraggableObjectWrapper
            objectType="team-cluster"
            objectId={`team-${team._id}`}
            onDragEnd={officeObjectId ? handleDragEnd : undefined}
            initialPosition={initialPosition}
            isDragEnabled={isDragEnabled && !!officeObjectId}
            showHoverEffect={true}
        >
            <group
                // Key is applied where this component is used (.map in OfficeScene)
                onClick={handleSafeTeamClick}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    if (shouldEnableLocalHover) {
                        setIsHovered(true);
                    }
                }}
                onPointerOut={(e) => {
                    e.stopPropagation();
                    if (shouldEnableLocalHover) {
                        setIsHovered(false);
                    }
                }}
            >
                {desks.map((desk) => (
                    <Desk
                        key={desk.id}
                        deskId={desk.id}
                        position={desk.position}
                        rotationY={desk.rotationY}
                        isHovered={shouldEnableLocalHover ? isHovered : false} // Only pass hover state when local hover is enabled
                    />
                ))}
            </group>
        </DraggableObjectWrapper>
    );
} 