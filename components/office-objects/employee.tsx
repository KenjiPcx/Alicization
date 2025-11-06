import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Box, Edges } from "@react-three/drei";
import {
    HAIR_COLORS, HAIR_WIDTH, HAIR_HEIGHT,
    HEAD_HEIGHT, HEAD_WIDTH,
    PANTS_COLORS, SHIRT_COLORS, SKIN_COLORS,
    TOTAL_HEIGHT,
    BODY_HEIGHT, LEG_HEIGHT, BODY_WIDTH,
    IDLE_DESTINATIONS
} from "@/constants";
import type { EmployeeData } from "@/lib/types";
import type { Group } from "three";
import * as THREE from 'three';
import { findPathAStar } from "@/lib/pathfinding/a-star-pathfinding";
import { findAvailableDestination, releaseEmployeeReservations } from "@/lib/pathfinding/destination-registry";
import PathVisualizer from "../navigation/path-visualizer";
import StatusIndicator from "../navigation/status-indicator";
import type { StatusType } from "../navigation/status-indicator";
import { getRandomItem } from "@/lib/utils";

interface EmployeeProps {
    _id: string;
    name: string;
    position: [number, number, number];
    isBusy?: boolean;
    isCEO?: boolean;
    gender?: string;
    onClick: () => void;
    debugMode?: boolean;
    status?: StatusType;
    statusMessage?: string;
}

const Employee = memo(function Employee({
    _id: id,
    name,
    position,
    isBusy,
    isCEO,
    gender,
    onClick,
    debugMode = false,
    status = 'none' as StatusType,
    statusMessage
}: EmployeeProps) {
    const groupRef = useRef<Group>(null);
    const initialPositionRef = useRef<THREE.Vector3>(new THREE.Vector3(position[0], TOTAL_HEIGHT / 2, position[2]));
    const [isHovered, setIsHovered] = useState(false);

    // Path State
    const [path, setPath] = useState<THREE.Vector3[] | null>(null);
    const [pathIndex, setPathIndex] = useState<number>(0);
    const [currentDestination, setCurrentDestination] = useState<THREE.Vector3 | null>(null);

    // Added: Store the original path for visualization (doesn't change as employee moves)
    const [originalPath, setOriginalPath] = useState<THREE.Vector3[] | null>(null);

    // Idle State
    const [idleState, setIdleState] = useState<'wandering' | 'waiting'>('wandering');
    const [idleTimer, setIdleTimer] = useState<number>(0);

    // Added flag for going to desk
    const [isGoingToDesk, setIsGoingToDesk] = useState(false);

    const movementSpeed = 1.5; // Units per second
    const arrivalThreshold = 0.1;

    // Colors (no change)
    const colors = useMemo(() => ({
        hair: getRandomItem(HAIR_COLORS),
        skin: getRandomItem(SKIN_COLORS),
        shirt: getRandomItem(SHIRT_COLORS),
        pants: getRandomItem(PANTS_COLORS),
    }), []);
    const finalColors = useMemo(() => isCEO ? {
        hair: "#FFD700", skin: getRandomItem(SKIN_COLORS), shirt: "#4B0082", pants: "#000000",
    } : colors, [isCEO, colors]);

    // Release destination reservations when component unmounts
    useEffect(() => {
        return () => {
            releaseEmployeeReservations(id);
        };
    }, [id]);

    // Set initial position
    useEffect(() => {
        if (groupRef.current) {
            groupRef.current.position.copy(initialPositionRef.current);
        }
    }, []);

    // Function to get a new idle destination
    const chooseNewIdleDestination = useCallback(() => {
        const currentPos = groupRef.current?.position;
        if (!currentPos) return null;

        let newDest: THREE.Vector3;
        do {
            newDest = getRandomItem(IDLE_DESTINATIONS).clone();
            newDest.y = TOTAL_HEIGHT / 2; // Ensure destination is on the ground plane (for pathfinding)
        } while (newDest.distanceTo(currentPos) < 1 && IDLE_DESTINATIONS.length > 1); // Don't pick same spot

        // Check destination registry for conflicts and get an available spot
        return findAvailableDestination(newDest, id);
    }, [id]);

    // Adjusted waiting times
    const getRandomWaitTime = useCallback(() => {
        // Wait 4-8 seconds at idle spots
        return Math.random() * 4 + 4;
    }, []);

    // Prepare path finding with original path storage
    const findAndSetPath = useCallback((
        startPos: THREE.Vector3,
        endPos: THREE.Vector3
    ) => {
        // For desk destinations, don't offset as each employee has a dedicated desk
        const finalDestination = isGoingToDesk ? endPos : findAvailableDestination(endPos, id);

        const newPath = findPathAStar(startPos, finalDestination);

        if (newPath) {
            // Store the complete original path for visualization
            setOriginalPath(newPath.map(p => p.clone())); // Deep clone to prevent modification

            // Set the active path for movement
            setPath(newPath);
            setPathIndex(0);
        }

        return newPath;
    }, [id, isGoingToDesk]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        const currentPos = groupRef.current.position;
        const desiredY = TOTAL_HEIGHT / 2;
        currentPos.y = desiredY; // Keep employee on the ground

        let targetPathNode: THREE.Vector3 | null = null;
        let isMoving = false;

        if (isBusy) {
            // Going back to desk when busy
            setIdleState('wandering');
            setIdleTimer(0);

            const deskPosition = initialPositionRef.current;
            if (currentPos.distanceTo(deskPosition) > arrivalThreshold) {
                if (!path || currentDestination !== deskPosition) {
                    // console.log(`Employee ${id} (${name}) is busy, pathing to desk`);
                    setIsGoingToDesk(true); // Set flag before finding path
                    const newPath = findAndSetPath(currentPos, deskPosition);
                    setCurrentDestination(deskPosition);
                    if (!newPath) console.warn(`Employee ${id} could not find path to desk.`);
                }

                if (path && pathIndex < path.length) {
                    targetPathNode = path[pathIndex];
                    isMoving = true;
                }
            } else {
                // At desk - clear paths and reset flags
                if (path) {
                    setPath(null);
                    setOriginalPath(null);
                    setIsGoingToDesk(false);
                    // Release destination when arrived
                    releaseEmployeeReservations(id);
                }
                setCurrentDestination(null);
                if (currentPos.distanceTo(deskPosition) > 0.01) currentPos.lerp(deskPosition, 0.1);
            }
        } else {
            // --- IDLE LOGIC --- 
            if (idleState === 'wandering') {
                if (!path) {
                    const newDest = chooseNewIdleDestination();
                    if (newDest) {
                        // console.log(`Employee ${id} (${name}) is idle, pathing to new destination`);
                        setIsGoingToDesk(false); // Set flag before finding path
                        const newPath = findAndSetPath(currentPos, newDest);
                        setCurrentDestination(newDest);
                        if (!newPath) console.warn(`Employee ${id} could not find path to new destination.`);
                    }
                } else {
                    if (pathIndex < path.length) {
                        targetPathNode = path[pathIndex];
                        isMoving = true;
                    } else {
                        // console.log(`Employee ${id} (${name}) reached idle destination, waiting...`);
                        setPath(null);
                        setOriginalPath(null); // Also clear original path when destination reached
                        setCurrentDestination(null);
                        setIdleState('waiting');
                        setIdleTimer(getRandomWaitTime()); // Use callback instead of inline
                        // Don't release the reservation yet, as employee is still occupying the spot
                    }
                }
            } else if (idleState === 'waiting') {
                setIdleTimer(t => Math.max(0, t - delta));
                if (idleTimer <= 0) {
                    // console.log(`Employee ${id} (${name}) finished waiting, wandering again.`);
                    // Release destination when leaving
                    releaseEmployeeReservations(id);
                    setIdleState('wandering');
                }
            }
        }

        // --- MOVEMENT LOGIC ---
        if (isMoving && targetPathNode) {
            targetPathNode = targetPathNode.clone();
            targetPathNode.y = desiredY;

            const direction = new THREE.Vector3().subVectors(targetPathNode, currentPos);
            const distance = direction.length();

            if (distance < arrivalThreshold) {
                setPathIndex(prev => prev + 1);
            } else {
                direction.normalize();
                const moveDistance = movementSpeed * delta;
                groupRef.current.position.add(direction.multiplyScalar(Math.min(moveDistance, distance)));
            }
        }
    });

    const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onClick();
    }, [onClick]);

    const handlePointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setIsHovered(true);
        document.body.style.cursor = 'pointer';
    }, []);

    const handlePointerOut = useCallback((event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setIsHovered(false);
        document.body.style.cursor = 'default';
    }, []);

    // For debug visualization: store current paths for the PathVisualizer
    const pathVisualizerData = useMemo(() => {
        if (!debugMode || !groupRef.current) return { originalPath: null, remainingPath: null };

        // Current position
        const currentPos = groupRef.current.position.clone();

        // Original planned path (from start to destination)
        const origPath = originalPath ? [currentPos, ...originalPath.slice(1)] : null;

        // Remaining path (from current position to destination)
        const remainPath = path && path.length > pathIndex ?
            [currentPos, ...path.slice(pathIndex)] : null;

        return {
            originalPath: origPath,
            remainingPath: remainPath,
        };
    }, [debugMode, originalPath, path, pathIndex]);

    // Generate status based on current state
    const currentStatus = useMemo(() => {
        // Use provided status if available and valid
        if (status && status !== 'none') {
            return status;
        }

        // Or generate based on state
        if (isBusy) {
            return 'info' as StatusType;
        }
        return 'none' as StatusType;
    }, [status, isBusy]);

    const baseY = -TOTAL_HEIGHT / 2;

    // The employee body + debug visualizations
    return (
        <>
            <group
                ref={groupRef}
                onClick={handleClick}
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
                name={`employee-${id}`}
                castShadow
            >
                {/* Legs */}
                <Box args={[BODY_WIDTH, LEG_HEIGHT, BODY_WIDTH * 0.6]} position={[0, baseY + LEG_HEIGHT / 2, 0]} castShadow>
                    <meshStandardMaterial color={finalColors.pants} />
                </Box>
                {/* Body */}
                <Box args={[BODY_WIDTH, BODY_HEIGHT, BODY_WIDTH * 0.6]} position={[0, baseY + LEG_HEIGHT + BODY_HEIGHT / 2, 0]} castShadow>
                    <meshStandardMaterial color={finalColors.shirt} />
                </Box>
                {/* Head */}
                <Box args={[HEAD_WIDTH, HEAD_HEIGHT, HEAD_WIDTH]} position={[0, baseY + LEG_HEIGHT + BODY_HEIGHT + HEAD_HEIGHT / 2, 0]} castShadow>
                    <meshStandardMaterial color={finalColors.skin} />
                </Box>
                {/* Hair */}
                <Box args={[HAIR_WIDTH, HAIR_HEIGHT, HAIR_WIDTH]} position={[0, baseY + LEG_HEIGHT + BODY_HEIGHT + HEAD_HEIGHT + HAIR_HEIGHT / 2, 0]} castShadow>
                    <meshStandardMaterial color={finalColors.hair} />
                </Box>

                {/* Status Indicator - above hair */}
                <StatusIndicator
                    status={currentStatus}
                    message={statusMessage}
                    visible={currentStatus !== 'none'}
                />

                {isHovered && <Edges scale={1.05} color="white" />}
            </group>

            {/* Path Visualization - Outside employee group to use world coords */}
            {debugMode && (
                <PathVisualizer
                    originalPath={pathVisualizerData.originalPath}
                    remainingPath={pathVisualizerData.remainingPath}
                    isGoingToDesk={isGoingToDesk}
                    employeeId={id}
                />
            )}
        </>
    );
});

export { Employee };