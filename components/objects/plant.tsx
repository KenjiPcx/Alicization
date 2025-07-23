import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Cylinder, Sphere } from "@react-three/drei";
import * as THREE from 'three';
import { DraggableObjectWrapper } from './draggable-object';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

interface PlantProps {
    position: [number, number, number];
    objectId?: string;
    companyId?: Id<"companies">;
    isDragEnabled?: boolean;
}

// Simple Plant Component
export default function Plant({
    position,
    objectId = `plant-${position.join(',')}`,
    companyId,
    isDragEnabled = true
}: PlantProps) {
    const [officeObjectId, setOfficeObjectId] = useState<Id<"officeObjects"> | null>(null);

    // Mutations and queries
    const getOrCreateOfficeObject = useMutation(api.officeObjects.getOrCreateOfficeObject);
    const updateOfficeObjectPosition = useMutation(api.officeObjects.updateOfficeObjectPosition);
    const savedObject = useQuery(
        api.officeObjects.getOfficeObject,
        officeObjectId ? { id: officeObjectId } : "skip"
    );

    // Initialize office object on mount
    useEffect(() => {
        if (companyId && !officeObjectId) {
            getOrCreateOfficeObject({
                companyId,
                meshType: 'plant',
                identifier: objectId,
                defaultPosition: position,
                defaultRotation: [0, 0, 0],
            }).then(id => {
                setOfficeObjectId(id);
            }).catch(error => {
                console.error('Failed to initialize plant:', error);
            });
        }
    }, [companyId, objectId, position, officeObjectId, getOrCreateOfficeObject]);

    // Handle drag end - save new position to database
    const handleDragEnd = useCallback(async (newPosition: THREE.Vector3) => {
        if (!officeObjectId) {
            console.warn('No office object ID available for plant');
            return;
        }

        try {
            await updateOfficeObjectPosition({
                id: officeObjectId,
                position: [newPosition.x, newPosition.y, newPosition.z],
            });
            console.log(`Updated plant ${objectId} position to:`, newPosition);
        } catch (error) {
            console.error('Failed to update plant position:', error);
        }
    }, [officeObjectId, objectId, updateOfficeObjectPosition]);

    // Use saved position if available, otherwise use provided position
    const initialPosition = savedObject?.position
        ? new THREE.Vector3(savedObject.position[0], savedObject.position[1], savedObject.position[2])
        : new THREE.Vector3(position[0], position[1], position[2]);

    return (
        <DraggableObjectWrapper
            objectType="furniture"
            objectId={objectId}
            onDragEnd={officeObjectId ? handleDragEnd : undefined}
            initialPosition={initialPosition}
            isDragEnabled={isDragEnabled && !!officeObjectId}
            showHoverEffect={true}
        >
            <group>
                {/* Pot */}
                <Cylinder args={[0.3, 0.35, 0.5, 16]} position={[0, 0.25, 0]} castShadow>
                    <meshStandardMaterial color="#8B4513" /> {/* SaddleBrown */}
                </Cylinder>
                {/* Foliage */}
                <Sphere args={[0.5, 16, 16]} position={[0, 0.5 + 0.3, 0]} castShadow>
                    <meshStandardMaterial color="#228B22" /> {/* ForestGreen */}
                </Sphere>
            </group>
        </DraggableObjectWrapper>
    );
}