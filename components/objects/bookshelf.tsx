import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Box } from "@react-three/drei";
import * as THREE from 'three';
import { DraggableObjectWrapper } from './draggable-object';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

interface BookshelfProps {
    position: THREE.Vector3Tuple;
    rotationY?: number;
    objectId?: string;
    companyId?: Id<"companies">;
    isDragEnabled?: boolean;
}

// Dimensions
const SHELF_WIDTH = 2.5;
const SHELF_HEIGHT = 1.8;
const SHELF_DEPTH = 0.4;
const PLANK_THICKNESS = 0.05;
const SIDE_WIDTH = 0.05;

// Colors
const WOOD_COLOR = "#8B4513"; // SaddleBrown

export default function Bookshelf({
    position,
    rotationY = 0,
    objectId = `bookshelf-${position.join(',')}`,
    companyId,
    isDragEnabled = true
}: BookshelfProps) {
    const numShelves = 4;
    const shelfSpacing = (SHELF_HEIGHT - PLANK_THICKNESS) / numShelves;
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
                meshType: 'bookshelf',
                identifier: objectId,
                defaultPosition: position,
                defaultRotation: [0, rotationY, 0],
            }).then(id => {
                setOfficeObjectId(id);
            }).catch(error => {
                console.error('Failed to initialize bookshelf:', error);
            });
        }
    }, [companyId, objectId, position, rotationY, officeObjectId, getOrCreateOfficeObject]);

    // Handle drag end - save new position to database
    const handleDragEnd = useCallback(async (newPosition: THREE.Vector3) => {
        if (!officeObjectId) {
            console.warn('No office object ID available for bookshelf');
            return;
        }

        try {
            await updateOfficeObjectPosition({
                id: officeObjectId,
                position: [newPosition.x, newPosition.y, newPosition.z],
                rotation: [0, rotationY, 0], // Keep original rotation for now
            });
            console.log(`Updated bookshelf ${objectId} position to:`, newPosition);
        } catch (error) {
            console.error('Failed to update bookshelf position:', error);
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
            <group rotation-y={rotationY}>
                {/* Sides */}
                <Box
                    args={[SIDE_WIDTH, SHELF_HEIGHT, SHELF_DEPTH]}
                    position={[-SHELF_WIDTH / 2 + SIDE_WIDTH / 2, SHELF_HEIGHT / 2, 0]}
                    castShadow receiveShadow
                >
                    <meshStandardMaterial color={WOOD_COLOR} />
                </Box>
                <Box
                    args={[SIDE_WIDTH, SHELF_HEIGHT, SHELF_DEPTH]}
                    position={[SHELF_WIDTH / 2 - SIDE_WIDTH / 2, SHELF_HEIGHT / 2, 0]}
                    castShadow receiveShadow
                >
                    <meshStandardMaterial color={WOOD_COLOR} />
                </Box>

                {/* Back */}
                <Box
                    args={[SHELF_WIDTH - SIDE_WIDTH * 2, SHELF_HEIGHT, PLANK_THICKNESS]}
                    position={[0, SHELF_HEIGHT / 2, -SHELF_DEPTH / 2 + PLANK_THICKNESS / 2]}
                    castShadow receiveShadow
                >
                    <meshStandardMaterial color={WOOD_COLOR} opacity={0.8} />
                </Box>

                {/* Shelves */}
                {Array.from({ length: numShelves + 1 }).map((_, i) => (
                    <Box
                        key={`shelf-${// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                            i}`}
                        args={[SHELF_WIDTH - SIDE_WIDTH * 2, PLANK_THICKNESS, SHELF_DEPTH - PLANK_THICKNESS]}
                        position={[0, PLANK_THICKNESS / 2 + i * shelfSpacing, 0]}
                        castShadow receiveShadow
                    >
                        <meshStandardMaterial color={WOOD_COLOR} />
                    </Box>
                ))}
            </group>
        </DraggableObjectWrapper>
    );
} 