import { useState, useCallback, useEffect } from 'react';
import { useMutation } from 'convex/react';
import * as THREE from 'three';
import Desk from './desk';
import type { DeskLayoutData, TeamData } from '@/lib/types';
import { DraggableObjectWrapper } from './draggable-object';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

interface TeamClusterProps {
    team: TeamData;
    desks: ReadonlyArray<DeskLayoutData>;
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

    // Mutations
    const getOrCreateOfficeObject = useMutation(api.officeObjects.getOrCreateOfficeObject);
    const updateOfficeObjectPosition = useMutation(api.officeObjects.updateOfficeObjectPosition);

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

    // Use team's clusterPosition for initial positioning
    const initialPosition = team.clusterPosition
        ? new THREE.Vector3(team.clusterPosition[0], team.clusterPosition[1], team.clusterPosition[2])
        : undefined;

    // Only enable local hover effects when drag mode is disabled
    const shouldEnableLocalHover = !isDragEnabled || !officeObjectId;

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
                onClick={(e) => { e.stopPropagation(); handleTeamClick(team); }}
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