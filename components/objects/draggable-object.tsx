import { useEffect, useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';
import { useDragDrop, type DraggableObject } from '@/hooks/use-drag-drop';

interface DraggableObjectProps {
    children: React.ReactNode;
    objectType: 'team-cluster' | 'furniture';
    objectId: string;
    onDragEnd?: (newPosition: THREE.Vector3) => void;
    initialPosition?: THREE.Vector3;
    isDragEnabled?: boolean;
    showHoverEffect?: boolean;
}

export function DraggableObjectWrapper({
    children,
    objectType,
    objectId,
    onDragEnd,
    initialPosition,
    isDragEnabled = true,
    showHoverEffect = true,
}: DraggableObjectProps) {
    const groupRef = useRef<THREE.Group>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const { dragState, registerDraggable, unregisterDraggable } = useDragDrop(isDragEnabled);

    // Memoize the onDragEnd callback to prevent unnecessary re-registrations
    const stableOnDragEnd = useCallback((newPosition: THREE.Vector3) => {
        onDragEnd?.(newPosition);
    }, [onDragEnd]);

    // Set initial position if provided
    useEffect(() => {
        if (groupRef.current && initialPosition) {
            groupRef.current.position.copy(initialPosition);
        }
    }, [initialPosition]);

    // Register this object as draggable
    useEffect(() => {
        if (groupRef.current && isDragEnabled) {
            const draggableObject: DraggableObject = {
                object3D: groupRef.current,
                objectType,
                objectId,
                onDragEnd: stableOnDragEnd,
            };

            registerDraggable(draggableObject);

            return () => {
                unregisterDraggable(objectId);
            };
        }
    }, [isDragEnabled, objectType, objectId, stableOnDragEnd, registerDraggable, unregisterDraggable]);

    // Update hover and drag states based on drag hook state
    useEffect(() => {
        const isThisObjectHovered = dragState.hoveredObject?.objectId === objectId;
        const isThisObjectDragging = dragState.draggedObject?.objectId === objectId;

        setIsHovered(isThisObjectHovered);
        setIsDragging(isThisObjectDragging);
    }, [dragState, objectId]);

    // Visual feedback during drag
    const dragOpacity = isDragging ? 0.7 : 1.0;
    const hoverScale = isHovered && !isDragging ? 1.02 : 1.0;

    useFrame(() => {
        if (groupRef.current) {
            // Smooth scale transition
            groupRef.current.scale.lerp(
                new THREE.Vector3(hoverScale, hoverScale, hoverScale),
                0.1
            );
        }
    });

    return (
        <group
            ref={groupRef}
            userData={{ objectId, objectType }}
        >
            {/* Main content with drag effects */}
            <group scale={[1, 1, 1]}>
                {/* Render children with modified material opacity during drag */}
                <group>
                    {children}
                </group>

                {/* Visual feedback effects */}
                {showHoverEffect && (isHovered || isDragging) && (
                    <Edges
                        scale={1.05}
                        color={isDragging ? "#ffff00" : "#ffffff"}
                        lineWidth={isDragging ? 3 : 2}
                    />
                )}

                {/* Drag indicator - show grid preview when dragging */}
                {isDragging && (
                    <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[1.5, 32]} />
                        <meshBasicMaterial
                            color="#ffff00"
                            transparent
                            opacity={0.2}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                )}
            </group>
        </group>
    );
} 