import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Box, Cylinder } from "@react-three/drei";
import * as THREE from 'three';
import { DraggableObjectWrapper } from './draggable-object';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

interface PantryProps {
    position: THREE.Vector3Tuple;
    rotationY?: number;
    objectId?: string;
    companyId?: Id<"companies">;
    isDragEnabled?: boolean;
}

// Dimensions
const COUNTER_HEIGHT = 1;
const COUNTER_DEPTH = 1;
const COUNTER_LENGTH = 6; // Doubled the length
const FRIDGE_WIDTH = 0.8;
const FRIDGE_HEIGHT = 1.8;
const FRIDGE_DEPTH = 0.75;
const MICROWAVE_WIDTH = 0.6;
const MICROWAVE_HEIGHT = 0.3;
const MICROWAVE_DEPTH = 0.4;
const JUG_RADIUS = 0.1;
const JUG_HEIGHT = 0.25;

// Colors
const COUNTER_COLOR = "#FFFFFF"; // Changed to white
const FRIDGE_COLOR = "#E0E0E0"; // Light Grey
const MICROWAVE_COLOR = "#333333"; // Dark Grey
const JUG_COLOR = "#ADD8E6"; // Light Blue

export default function Pantry({
    position,
    rotationY = 0,
    objectId = `pantry-${position.join(',')}`,
    companyId,
    isDragEnabled = true
}: PantryProps) {
    const fridgePositionX = COUNTER_LENGTH / 2 + FRIDGE_WIDTH / 2; // Place fridge at the positive X end
    const counterTopY = COUNTER_HEIGHT;
    const counterCenterZ = -COUNTER_DEPTH / 2; // Mid-depth of the counter in local space
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
                meshType: 'pantry',
                identifier: objectId,
                defaultPosition: position,
                defaultRotation: [0, rotationY, 0],
            }).then(id => {
                setOfficeObjectId(id);
            }).catch(error => {
                console.error('Failed to initialize pantry:', error);
            });
        }
    }, [companyId, objectId, position, rotationY, officeObjectId, getOrCreateOfficeObject]);

    // Handle drag end - save new position to database
    const handleDragEnd = useCallback(async (newPosition: THREE.Vector3) => {
        if (!officeObjectId) {
            console.warn('No office object ID available for pantry');
            return;
        }

        try {
            await updateOfficeObjectPosition({
                id: officeObjectId,
                position: [newPosition.x, newPosition.y, newPosition.z],
                rotation: [0, rotationY, 0], // Keep original rotation for now
            });
            console.log(`Updated pantry ${objectId} position to:`, newPosition);
        } catch (error) {
            console.error('Failed to update pantry position:', error);
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
                {/* Main Counter - White */}
                <Box
                    args={[COUNTER_LENGTH, COUNTER_HEIGHT, COUNTER_DEPTH]}
                    // Position counter so its back edge aligns with Z=0 in local space
                    position={[0, COUNTER_HEIGHT / 2, -COUNTER_DEPTH / 2]}
                    castShadow receiveShadow
                >
                    <meshStandardMaterial color={COUNTER_COLOR} />
                </Box>

                {/* Fridge - At one end */}
                <Box
                    args={[FRIDGE_WIDTH, FRIDGE_HEIGHT, FRIDGE_DEPTH]}
                    // Position fridge at the end, aligned with the back of the counter
                    position={[fridgePositionX, FRIDGE_HEIGHT / 2, -FRIDGE_DEPTH / 2]}
                    castShadow receiveShadow
                >
                    <meshStandardMaterial color={FRIDGE_COLOR} />
                </Box>

                {/* Microwave on Counter */}
                <Box
                    args={[MICROWAVE_WIDTH, MICROWAVE_HEIGHT, MICROWAVE_DEPTH]}
                    // Position near the start of the counter, on top, towards the back
                    position={[-COUNTER_LENGTH / 2 + MICROWAVE_WIDTH / 2 + 0.2, counterTopY + MICROWAVE_HEIGHT / 2, counterCenterZ]}
                    castShadow receiveShadow
                >
                    <meshStandardMaterial color={MICROWAVE_COLOR} />
                </Box>

                {/* Jug 1 on Counter */}
                <Cylinder
                    args={[JUG_RADIUS, JUG_RADIUS, JUG_HEIGHT, 16]} // topRadius, bottomRadius, height, radialSegments
                    // Position further down the counter, on top, mid-depth
                    position={[-COUNTER_LENGTH / 2 + 1.5, counterTopY + JUG_HEIGHT / 2, counterCenterZ]}
                    castShadow receiveShadow
                >
                    <meshStandardMaterial color={JUG_COLOR} />
                </Cylinder>

                {/* Jug 2 on Counter */}
                <Cylinder
                    args={[JUG_RADIUS, JUG_RADIUS, JUG_HEIGHT, 16]}
                    // Position near the middle, on top, mid-depth
                    position={[0, counterTopY + JUG_HEIGHT / 2, counterCenterZ]}
                    castShadow receiveShadow
                >
                    <meshStandardMaterial color={JUG_COLOR} />
                </Cylinder>

                {/* Removed Lower Cabinets, Upper Cabinets, and Microwave */}
            </group>
        </DraggableObjectWrapper>
    );
}