import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Box } from "@react-three/drei";
import * as THREE from 'three';
import { DraggableObjectWrapper } from './draggable-object';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

interface CouchProps {
    position: [number, number, number];
    rotationY: number;
    objectId?: string;
    companyId?: Id<"companies">;
    isDragEnabled?: boolean;
}

// Simple Couch Component
export default function Couch({
    position,
    rotationY,
    objectId = `couch-${position.join(',')}`,
    companyId,
    isDragEnabled = true
}: CouchProps) {
    const couchColor = "#4682B4"; // SteelBlue
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
                meshType: 'couch',
                identifier: objectId,
                defaultPosition: position,
                defaultRotation: [0, rotationY, 0],
            }).then(id => {
                setOfficeObjectId(id);
            }).catch(error => {
                console.error('Failed to initialize couch:', error);
            });
        }
    }, [companyId, objectId, position, rotationY, officeObjectId, getOrCreateOfficeObject]);

    // Handle drag end - save new position to database
    const handleDragEnd = useCallback(async (newPosition: THREE.Vector3) => {
        if (!officeObjectId) {
            console.warn('No office object ID available for couch');
            return;
        }

        try {
            await updateOfficeObjectPosition({
                id: officeObjectId,
                position: [newPosition.x, newPosition.y, newPosition.z],
                rotation: [0, rotationY, 0], // Keep original rotation for now
            });
            console.log(`Updated couch ${objectId} position to:`, newPosition);
        } catch (error) {
            console.error('Failed to update couch position:', error);
        }
    }, [officeObjectId, objectId, rotationY, updateOfficeObjectPosition]);

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
            <group rotation={[0, rotationY, 0]}>
                {/* Base */}
                <Box args={[2.5, 0.4, 1]} position={[0, 0.2, 0]} castShadow>
                    <meshStandardMaterial color={couchColor} />
                </Box>
                {/* Back */}
                <Box args={[2.5, 0.6, 0.2]} position={[0, 0.4 + 0.3, -0.5 + 0.1]} castShadow>
                    <meshStandardMaterial color={couchColor} />
                </Box>
                {/* Arms */}
                <Box args={[0.2, 0.3, 1]} position={[-1.25 + 0.1, 0.4 + 0.15, 0]} castShadow>
                    <meshStandardMaterial color={couchColor} />
                </Box>
                <Box args={[0.2, 0.3, 1]} position={[1.25 - 0.1, 0.4 + 0.15, 0]} castShadow>
                    <meshStandardMaterial color={couchColor} />
                </Box>
            </group>
        </DraggableObjectWrapper>
    );
}