import { useEffect, useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMutation } from 'convex/react';
import { useDragDrop, type DraggableObject } from '@/hooks/use-drag-drop';
import { useAppStore } from '@/lib/store/app-store';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

interface DraggableObjectProps {
    children: React.ReactNode;
    objectType: 'team-cluster' | 'furniture';
    showHoverEffect?: boolean;

    // Database-related props
    objectId: Id<"officeObjects">;
    companyId?: Id<"companies">;
    initialPosition?: [number, number, number];
    initialRotation?: [number, number, number];
}

export function DraggableObjectWrapper({
    children,
    objectType,
    showHoverEffect = true,
    objectId,
    companyId,
    initialPosition = [0, 0, 0],
    initialRotation = [0, 0, 0],
}: DraggableObjectProps) {
    const groupRef = useRef<THREE.Group>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isLocallyDragging, setIsLocallyDragging] = useState(false);
    const [isShowingRotationControls, setIsShowingRotationControls] = useState(false);

    // Get drag enabled state from app store
    const { isBuilderMode, setIsDragging } = useAppStore();
    const isDragEnabled = isBuilderMode && !!companyId;

    // Use local position state for optimistic updates
    const [localPosition, setLocalPosition] = useState<[number, number, number]>(initialPosition);
    const [localRotation, setLocalRotation] = useState<[number, number, number]>(initialRotation);

    // These probably won't be called given we don't want to rerender the object when the position changes
    // We will handle it optimistically in the handleDragEnd function
    // Update local position when initialPosition changes (from database)
    // useEffect(() => {
    //     if (initialPosition) {
    //         setLocalPosition(initialPosition);
    //     }
    // }, [initialPosition]);

    // useEffect(() => {
    //     if (initialRotation) {
    //         setLocalRotation(initialRotation);
    //     }
    // }, [initialRotation]);

    // Database operations for position updates
    const updateOfficeObjectPosition = useMutation(api.officeObjects.updateOfficeObjectPosition);

    const { dragState, registerDraggable, unregisterDraggable } = useDragDrop(isDragEnabled);

    // Handle drag end - optimistic update + async DB sync
    const handleDragEnd = useCallback(async (newPosition: THREE.Vector3) => {
        const newPosArray: [number, number, number] = [newPosition.x, newPosition.y, newPosition.z];

        // Immediate optimistic update
        setLocalPosition(newPosArray);

        // Async database update
        if (objectId) {
            try {
                await updateOfficeObjectPosition({
                    id: objectId,
                    position: newPosArray,
                });
                console.log(`Updated ${objectId} position to:`, newPosition);
            } catch (error) {
                console.error(`Failed to update ${objectId} position:`, error);
                // Revert optimistic update on error
                setLocalPosition(initialPosition);
            }
        }
    }, [objectId, updateOfficeObjectPosition, initialPosition]);

    // Handle 90-degree rotation - optimistic update + async DB sync
    const handleRotate90 = useCallback(async (direction: 'left' | 'right') => {
        const rotationIncrement = direction === 'right' ? Math.PI / 2 : -Math.PI / 2;
        const newRotationY = localRotation[1] + rotationIncrement;
        const newRotArray: [number, number, number] = [localRotation[0], newRotationY, localRotation[2]];

        // Immediate optimistic update
        setLocalRotation(newRotArray);

        // Async database update
        if (objectId) {
            try {
                await updateOfficeObjectPosition({
                    id: objectId,
                    position: localPosition,
                    rotation: newRotArray,
                });

            } catch (error) {
                console.error(`Failed to update ${objectId} rotation:`, error);
                // Revert optimistic update on error
                setLocalRotation(initialRotation);
            }
        }
    }, [objectId, updateOfficeObjectPosition, localPosition, localRotation, initialRotation]);

    // Handle object click in builder mode
    const handleObjectClick = useCallback((event: any) => {
        if (isDragEnabled && !isLocallyDragging) {
            event.stopPropagation();
            const newState = !isShowingRotationControls;

            setIsShowingRotationControls(newState);
            // Set isDragging state to prevent orbit controls during rotation
            setIsDragging(newState);
        }
    }, [isDragEnabled, isLocallyDragging, isShowingRotationControls, setIsDragging]);

    // Set position in Three.js scene
    useEffect(() => {
        if (groupRef.current) {
            groupRef.current.position.set(localPosition[0], localPosition[1], localPosition[2]);
        }
    }, [localPosition]);

    useEffect(() => {
        if (groupRef.current) {
            groupRef.current.rotation.set(localRotation[0], localRotation[1], localRotation[2]);
        }
    }, [localRotation]);

    // Register this object as draggable
    useEffect(() => {
        if (groupRef.current && isDragEnabled) {
            const draggableObject: DraggableObject = {
                object3D: groupRef.current,
                objectType,
                objectId: objectId.toString(),
                onDragEnd: handleDragEnd,
            };

            registerDraggable(draggableObject);

            return () => {
                unregisterDraggable(objectId.toString());
            };
        }
    }, [isDragEnabled, objectType, objectId, handleDragEnd, registerDraggable, unregisterDraggable]);

    // Update hover and drag states based on drag hook state
    useEffect(() => {
        const isThisObjectHovered = dragState.hoveredObject?.objectId === objectId.toString();
        const isThisObjectDragging = dragState.draggedObject?.objectId === objectId.toString();

        setIsHovered(isThisObjectHovered);
        setIsLocallyDragging(isThisObjectDragging);

        // Hide rotation controls when dragging starts
        if (isThisObjectDragging) {
            setIsShowingRotationControls(false);
        }
    }, [dragState, objectId]);

    // Hide rotation controls when leaving builder mode
    useEffect(() => {
        if (!isDragEnabled) {
            setIsShowingRotationControls(false);
            setIsDragging(false);
        }
    }, [isDragEnabled, setIsDragging]);



    // Hide rotation controls when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Only handle clicks when rotation controls are showing
            if (!isShowingRotationControls) return;

            // If the click target is within our object's controls, don't hide
            const target = event.target as Element;
            if (target?.closest && target.closest('[data-rotation-controls]')) {
                return;
            }

            setIsShowingRotationControls(false);
            setIsDragging(false);
        };

        if (isShowingRotationControls) {
            document.addEventListener('click', handleClickOutside);
            return () => {
                document.removeEventListener('click', handleClickOutside);
            };
        }
    }, [isShowingRotationControls]);

    // Visual feedback during drag
    const dragOpacity = isLocallyDragging ? 0.7 : 1.0;
    const hoverScale = isHovered && !isLocallyDragging ? 1.02 : 1.0;

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
            userData={{ objectId: objectId.toString(), objectType }}
            onClick={handleObjectClick}
        >
            {/* Main content with drag effects */}
            <group scale={[1, 1, 1]}>
                {/* Render children with modified material opacity during drag */}
                <group>
                    {children}
                </group>

                {/* Visual feedback effects */}
                {showHoverEffect && (isHovered || isLocallyDragging || isShowingRotationControls) && (
                    <Edges
                        scale={1.05}
                        color={isLocallyDragging ? "#ffff00" : isShowingRotationControls ? "#00ff00" : "#ffffff"}
                        lineWidth={isLocallyDragging ? 3 : isShowingRotationControls ? 2 : 2}
                    />
                )}

                {/* Drag indicator - show grid preview when dragging */}
                {isLocallyDragging && (
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

                {/* Rotation indicator - show when rotation controls are active */}
                {isShowingRotationControls && (
                    <group>
                        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[1.5, 2.0, 32]} />
                            <meshBasicMaterial
                                color="#00ff00"
                                transparent
                                opacity={0.4}
                                side={THREE.DoubleSide}
                            />
                        </mesh>
                        {/* Pulsing center dot */}
                        <mesh position={[0, 0.01, 0]}>
                            <sphereGeometry args={[0.15]} />
                            <meshBasicMaterial
                                color="#00ff00"
                                transparent
                                opacity={0.8}
                            />
                        </mesh>
                    </group>
                )}

                {/* Rotation controls - show when object is selected */}
                {isShowingRotationControls && (
                    <Html
                        position={[0, 2, 0]}
                        center
                        distanceFactor={6}
                        zIndexRange={[100, 0]}
                    >
                        <div
                            data-rotation-controls
                            style={{
                                background: 'linear-gradient(135deg, rgba(0,255,0,0.1) 0%, rgba(0,0,0,0.9) 100%)',
                                padding: '20px 24px',
                                borderRadius: '12px',
                                border: '3px solid #00ff00',
                                minWidth: '280px',
                                fontSize: '14px',
                                color: 'white',
                                fontWeight: 'bold',
                                boxShadow: '0 8px 24px rgba(0,255,0,0.3), 0 4px 12px rgba(0,0,0,0.7)',
                                backdropFilter: 'blur(12px)',
                                transform: 'scale(1.0)',
                                pointerEvents: 'auto'
                            }}
                        >
                            <div style={{
                                marginBottom: '16px',
                                textAlign: 'center',
                                color: '#00ff00',
                                fontSize: '16px',
                                textShadow: '0 0 8px rgba(0,255,0,0.5)'
                            }}>
                                🔄 ROTATE OBJECT
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                marginBottom: '16px'
                            }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRotate90('left');
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '12px 16px',
                                        background: 'linear-gradient(135deg, rgba(255,100,100,0.2) 0%, rgba(0,0,0,0.8) 100%)',
                                        border: '2px solid #ff6464',
                                        borderRadius: '8px',
                                        color: '#ff6464',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        textShadow: '0 0 4px rgba(255,100,100,0.5)',
                                        boxShadow: '0 4px 12px rgba(255,100,100,0.2)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,100,100,0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.0)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,100,100,0.2)';
                                    }}
                                >
                                    ↺ LEFT 90°
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRotate90('right');
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '12px 16px',
                                        background: 'linear-gradient(135deg, rgba(100,255,100,0.2) 0%, rgba(0,0,0,0.8) 100%)',
                                        border: '2px solid #64ff64',
                                        borderRadius: '8px',
                                        color: '#64ff64',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        textShadow: '0 0 4px rgba(100,255,100,0.5)',
                                        boxShadow: '0 4px 12px rgba(100,255,100,0.2)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(100,255,100,0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.0)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(100,255,100,0.2)';
                                    }}
                                >
                                    ↻ RIGHT 90°
                                </button>
                            </div>

                            <div style={{
                                textAlign: 'center',
                                fontSize: '12px',
                                color: '#aaa'
                            }}>
                                Current: <span style={{
                                    color: '#00ff00',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    textShadow: '0 0 4px rgba(0,255,0,0.5)'
                                }}>
                                    {Math.round((localRotation[1] * 180) / Math.PI)}°
                                </span>
                            </div>
                        </div>
                    </Html>
                )}
            </group>
        </group>
    );
} 