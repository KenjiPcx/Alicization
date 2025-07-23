import { useCallback, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getGridData } from '@/lib/pathfinding/a-star-pathfinding';

export interface DraggableObject {
    object3D: THREE.Object3D;
    objectType: 'team-cluster' | 'furniture';
    objectId: string;
    onDragEnd?: (newPosition: THREE.Vector3) => void;
}

export interface DragState {
    isDragging: boolean;
    draggedObject: DraggableObject | null;
    dragOffset: THREE.Vector3;
    hoveredObject: DraggableObject | null;
}

export function useDragDrop(enabled: boolean = true) {
    const { camera, gl, scene } = useThree();
    const [dragState, setDragState] = useState<DragState>({
        isDragging: false,
        draggedObject: null,
        dragOffset: new THREE.Vector3(),
        hoveredObject: null,
    });

    const raycaster = useRef(new THREE.Raycaster());
    const mouse = useRef(new THREE.Vector2());
    const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
    const planeIntersect = useRef(new THREE.Vector3());
    const draggableObjects = useRef<DraggableObject[]>([]);

    // Snap position to pathfinding grid
    const snapToGrid = useCallback((position: THREE.Vector3): THREE.Vector3 => {
        const { cellSize, worldOffsetX, worldOffsetZ } = getGridData();

        if (cellSize === 0) {
            // Grid not initialized, return original position
            return position.clone();
        }

        // Convert world position to grid coordinates
        const gridX = Math.round((position.x + worldOffsetX) / cellSize);
        const gridZ = Math.round((position.z + worldOffsetZ) / cellSize);

        // Convert back to world position (centered on grid cell)
        const snappedX = gridX * cellSize - worldOffsetX;
        const snappedZ = gridZ * cellSize - worldOffsetZ;

        return new THREE.Vector3(snappedX, position.y, snappedZ);
    }, []);

    // Register a draggable object
    const registerDraggable = useCallback((draggableObject: DraggableObject) => {
        draggableObjects.current.push(draggableObject);
        // Add user data for identification
        draggableObject.object3D.userData.draggable = draggableObject;
        console.log('✅ Registered draggable object:', draggableObject.objectId);
    }, []);

    // Unregister a draggable object
    const unregisterDraggable = useCallback((objectId: string) => {
        draggableObjects.current = draggableObjects.current.filter(
            obj => obj.objectId !== objectId
        );
    }, []);

    // Get mouse position in normalized device coordinates
    const getMousePosition = useCallback((event: MouseEvent | PointerEvent): THREE.Vector2 => {
        const rect = gl.domElement.getBoundingClientRect();
        return new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
    }, [gl]);

    // Find intersected draggable objects
    const findDraggableIntersection = useCallback((mousePos: THREE.Vector2): DraggableObject | null => {
        raycaster.current.setFromCamera(mousePos, camera);

        // Instead of only checking registered objects, check all objects in the scene
        // and traverse up to find if any parent is a registered draggable object
        const intersects = raycaster.current.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            // For each intersection, traverse up the hierarchy to find a draggable object
            for (const intersect of intersects) {
                let current = intersect.object;

                // Traverse up the parent chain
                while (current) {
                    // Check if this object or any of its ancestors is a registered draggable
                    const foundDraggable = draggableObjects.current.find(
                        draggableObj => draggableObj.object3D === current
                    );

                    if (foundDraggable) {
                        return foundDraggable;
                    }

                    current = current.parent;
                }
            }
        }

        return null;
    }, [camera, scene]);

    // Handle mouse down
    const handleMouseDown = useCallback((event: MouseEvent) => {
        if (!enabled) return;

        mouse.current = getMousePosition(event);
        const intersectedDraggable = findDraggableIntersection(mouse.current);

        if (intersectedDraggable && intersectedDraggable.object3D && intersectedDraggable.object3D.position) {
            console.log('🔥 Starting drag for:', intersectedDraggable.objectId);

            // Calculate intersection with floor plane for drag offset
            raycaster.current.setFromCamera(mouse.current, camera);
            raycaster.current.ray.intersectPlane(plane.current, planeIntersect.current);

            const dragOffset = new THREE.Vector3()
                .subVectors(intersectedDraggable.object3D.position, planeIntersect.current);

            setDragState({
                isDragging: true,
                draggedObject: intersectedDraggable,
                dragOffset,
                hoveredObject: null,
            });

            // Change cursor
            gl.domElement.style.cursor = 'grabbing';
        }
    }, [enabled, camera, gl, getMousePosition, findDraggableIntersection]);

    // Handle mouse move
    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (!enabled) return;

        mouse.current = getMousePosition(event);

        if (dragState.isDragging && dragState.draggedObject && dragState.draggedObject.object3D) {
            // Update dragged object position
            raycaster.current.setFromCamera(mouse.current, camera);
            raycaster.current.ray.intersectPlane(plane.current, planeIntersect.current);

            const newPosition = new THREE.Vector3()
                .addVectors(planeIntersect.current, dragState.dragOffset);

            // Snap to grid
            const snappedPosition = snapToGrid(newPosition);
            dragState.draggedObject.object3D.position.copy(snappedPosition);
        } else {
            // Handle hover highlighting
            const intersectedDraggable = findDraggableIntersection(mouse.current);

            if (intersectedDraggable !== dragState.hoveredObject) {
                setDragState(prev => ({
                    ...prev,
                    hoveredObject: intersectedDraggable,
                }));

                // Change cursor
                gl.domElement.style.cursor = intersectedDraggable ? 'grab' : 'default';
            }
        }
    }, [enabled, camera, gl, dragState, getMousePosition, findDraggableIntersection, snapToGrid]);

    // Handle mouse up
    const handleMouseUp = useCallback(() => {
        if (!enabled) return;

        if (dragState.isDragging && dragState.draggedObject) {
            console.log('💾 Drag ended, saving position for:', dragState.draggedObject.objectId);

            // Call onDragEnd callback with final position
            if (dragState.draggedObject.onDragEnd) {
                dragState.draggedObject.onDragEnd(dragState.draggedObject.object3D.position.clone());
            }
        }

        setDragState({
            isDragging: false,
            draggedObject: null,
            dragOffset: new THREE.Vector3(),
            hoveredObject: dragState.hoveredObject,
        });

        // Reset cursor
        gl.domElement.style.cursor = 'default';
    }, [enabled, gl, dragState]);

    // Set up event listeners
    useEffect(() => {
        if (!enabled || !gl.domElement) return;

        const element = gl.domElement;

        // Add event listeners
        element.addEventListener('mousedown', handleMouseDown);
        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseup', handleMouseUp);
        element.addEventListener('mouseleave', handleMouseUp); // Cancel drag on mouse leave

        return () => {
            // Clean up event listeners
            element.removeEventListener('mousedown', handleMouseDown);
            element.removeEventListener('mousemove', handleMouseMove);
            element.removeEventListener('mouseup', handleMouseUp);
            element.removeEventListener('mouseleave', handleMouseUp);
        };
    }, [enabled, gl.domElement, handleMouseDown, handleMouseMove, handleMouseUp]);

    return {
        dragState,
        registerDraggable,
        unregisterDraggable,
        snapToGrid,
    };
} 