'use client';

import { Box, OrbitControls } from '@react-three/drei';
import { useMemo, memo, useRef, useEffect, createRef, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { useAppStore } from '@/lib/store/app-store';
import { useChatActions } from '@/lib/store/chat-store';
import { useQuery } from 'convex/react';
import type { EmployeeData, DeskLayoutData, TeamData, OfficeObject } from '@/lib/types';
import { Employee } from './objects/employee';
import Desk from './objects/desk';
import TeamCluster from './objects/team-cluster';
import Plant from './objects/plant';
import Couch from './objects/couch';
import Bookshelf from './objects/bookshelf';
import Pantry from './objects/pantry';
import {
    WALL_THICKNESS,
    WALL_HEIGHT,
    FLOOR_SIZE,
    HALF_FLOOR,
} from '@/constants';
import { initializeGrid } from '@/lib/pathfinding/a-star-pathfinding';
import { SmartGrid } from './debug/unified-grid-helper';
import { DestinationDebugger } from './debug/destination-debugger';
import type { StatusType } from './navigation/status-indicator';
import { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import GlassWall from './objects/glass-wall';

// Sample status messages
const SAMPLE_MESSAGES = [
    'Working on task...',
    'Analyzing data',
    'Writing report',
    'In a meeting',
    'Taking a break',
    'Debugging code',
    'Planning sprint',
    'Reviewing PR',
    'On a call',
];

// Helper function to assign random statuses to some employees
function assignRandomStatuses(employees: EmployeeData[]): EmployeeData[] {
    // Update status types - 'message' is no longer a status type
    const statusTypes: StatusType[] = ['info', 'success', 'question', 'warning'];

    return employees.map((emp) => {
        // CEO always has 'info' status with a message
        if (emp.builtInRole === 'ceo') {
            return {
                ...emp,
                status: 'info' as StatusType,
                statusMessage: emp.statusMessage || 'Managing the team',
            };
        }

        // Give ~60% of employees a random status
        if (Math.random() < 0.6) {
            const randomStatus =
                statusTypes[Math.floor(Math.random() * statusTypes.length)];

            // Give 75% of employees with status a message too
            const shouldHaveMessage = Math.random() < 0.75;
            const randomMessage = shouldHaveMessage
                ? SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)]
                : emp.statusMessage;

            return {
                ...emp,
                status: randomStatus as StatusType,
                statusMessage: randomMessage || emp.statusMessage,
            };
        }

        // Return with existing status unchanged
        return emp;
    });
}

interface SceneContentsProps {
    teams: TeamData[];
    employees: EmployeeData[];
    desks: DeskLayoutData[];
    companyId?: Id<"companies">; // Add companyId for drag-and-drop functionality
}

const SceneContents = ({
    teams,
    employees,
    desks,
    companyId,
}: SceneContentsProps) => {
    const { isBuilderMode, debugMode, setIsChatModalOpen, setActiveChatParticipant, isAnimatingCamera, setAnimatingCamera, isDragging } = useAppStore();
    const { getLatestThreadId, setThreadId } = useChatActions();

    // Load all office objects from database
    const allOfficeObjects = useQuery(
        api.officeObjects.getOfficeObjects,
        companyId ? { companyId } : "skip"
    );

    // Use animation state to prevent scene updates during transitions
    const sceneBuilderMode = isAnimatingCamera ? false : isBuilderMode;

    const orbitControlsRef = useRef<any>(null);
    const floorRef = useRef<THREE.Mesh>(null);
    const ceoDeskRef = useRef<THREE.Group>(null);

    // Create refs for office objects - we'll collect these for obstacle detection
    const officeObjectRefs = useRef<Map<string, React.RefObject<THREE.Group | null>>>(new Map());

    const handleEmployeeClick = useCallback(
        async (employee: Omit<EmployeeData, 'companyId'>) => {
            setActiveChatParticipant({
                type: 'employee',
                employeeId: employee._id as Id<"employees">,
                teamId: employee.teamId as Id<"teams">
            });
            setThreadId(await getLatestThreadId(employee._id, "employee"));
            setIsChatModalOpen(true);
        },
        [setActiveChatParticipant, setIsChatModalOpen, getLatestThreadId, setThreadId],
    );

    const handleTeamClick = useCallback(
        async (team: TeamData) => {
            // Use supervisor as the employee ID for team chats
            if (!team.supervisorId) {
                console.error('Team has no supervisor:', team);
                return;
            }

            setActiveChatParticipant({
                type: 'team',
                employeeId: team.supervisorId as Id<"employees">,
                teamId: team._id as Id<"teams">
            });
            // Use team ID as chatOwnerId to distinguish from direct supervisor chats
            setThreadId(await getLatestThreadId(team._id, "team"));
            setIsChatModalOpen(true);
        },
        [setActiveChatParticipant, setIsChatModalOpen, getLatestThreadId, setThreadId],
    );

    const desksByTeam = useMemo(() => {
        const grouped: Record<string, Array<DeskLayoutData>> = {};
        for (const desk of desks) {
            if (desk.team === 'CEO') continue;
            if (!grouped[desk.team]) {
                grouped[desk.team] = [];
            }
            grouped[desk.team].push(desk);
        }
        return grouped;
    }, [desks]);

    const officeObjectIdsString = useMemo(() => {
        if (!allOfficeObjects) return '';
        return allOfficeObjects.map(obj => obj._id).join(',');
    }, [allOfficeObjects])

    // Render office objects with refs for obstacle collection
    // Only renders when new objects are added to the scene
    const officeObjectsRendered = useMemo(() => {
        if (!allOfficeObjects) return null;
        return allOfficeObjects.map(obj => {
            // Create or get ref for this object
            if (!officeObjectRefs.current.has(obj._id)) {
                officeObjectRefs.current.set(obj._id, createRef<THREE.Group>());
            }
            const objRef = officeObjectRefs.current.get(obj._id)!;

            switch (obj.meshType) {
                case 'plant':
                    return (
                        <group key={obj._id} ref={objRef} name={`obstacle-plant-${obj._id}`}>
                            <Plant
                                objectId={obj._id}
                                position={obj.position as [number, number, number]}
                                rotation={obj.rotation as [number, number, number]}
                                companyId={companyId}
                            />
                        </group>
                    );

                case 'couch':
                    return (
                        <group key={obj._id} ref={objRef} name={`obstacle-couch-${obj._id}`}>
                            <Couch
                                objectId={obj._id}
                                position={obj.position as [number, number, number]}
                                rotation={obj.rotation as [number, number, number]}
                                companyId={companyId}
                            />
                        </group>
                    );

                case 'bookshelf':
                    return (
                        <group key={obj._id} ref={objRef} name={`obstacle-bookshelf-${obj._id}`}>
                            <Bookshelf
                                objectId={obj._id}
                                position={obj.position as [number, number, number]}
                                rotation={obj.rotation as [number, number, number]}
                                companyId={companyId}
                            />
                        </group>
                    );

                case 'pantry':
                    return (
                        <group key={obj._id} ref={objRef} name={`obstacle-pantry-${obj._id}`}>
                            <Pantry
                                objectId={obj._id}
                                position={obj.position as [number, number, number]}
                                rotation={obj.rotation as [number, number, number]}
                                companyId={companyId}
                            />
                        </group>
                    );

                case 'team-cluster':
                    // Team clusters need special handling with teams/desks data
                    const team = teams.find(t => t._id === obj.metadata?.teamId);
                    const teamDesks = desks.filter(d => d.team === team?.name);

                    if (!team) return null;

                    return (
                        <group key={obj._id} ref={objRef} name={`obstacle-cluster-${team.name}`}>
                            <TeamCluster
                                team={team}
                                desks={teamDesks}
                                handleTeamClick={handleTeamClick}
                                companyId={companyId}
                                objectId={obj._id}
                                position={obj.position as [number, number, number]}
                                rotation={obj.rotation as [number, number, number]}
                            />
                        </group>
                    );

                case 'glass-wall':
                    console.log("Rendering glass wall Kenji", obj.position)
                    return (
                        <group key={obj._id} ref={objRef} name={`obstacle-glass-wall-${obj._id}`}>
                            <GlassWall
                                objectId={obj._id}
                                position={obj.position as [number, number, number]}
                                rotation={obj.rotation as [number, number, number]}
                                companyId={companyId}
                            />
                        </group>
                    )

                default:
                    console.warn(`Unknown meshType: ${obj.meshType}`);
                    return null;
            }
        });
    }, [officeObjectIdsString, teams, desks, handleTeamClick, companyId]);

    // Updated obstacle collection using office object refs
    useEffect(() => {
        const checkRefsInterval = setInterval(() => {
            console.log("Checking refs Kenji")
            const obstacles: THREE.Object3D[] = [];

            // Add CEO desk if available
            if (ceoDeskRef.current) obstacles.push(ceoDeskRef.current);

            // Add office objects (plants, couches, bookshelves, pantries, team clusters)
            for (const objRef of officeObjectRefs.current.values()) {
                if (objRef.current) {
                    obstacles.push(objRef.current);
                }
            }

            // Calculate expected counts
            const expectedOfficeObjectCount = allOfficeObjects?.length || 0;

            let currentCeoDesk = ceoDeskRef.current ? 1 : 0;
            const currentOfficeObjectCount = Array.from(officeObjectRefs.current.values()).filter(ref => ref.current).length;

            if (
                currentCeoDesk >= 1 &&
                currentOfficeObjectCount === expectedOfficeObjectCount &&
                expectedOfficeObjectCount > 0 // Only initialize if we have objects to work with
            ) {
                clearInterval(checkRefsInterval);
                console.log('All obstacle refs available, initializing A* grid...');
                console.log(
                    'Obstacles passed:',
                    obstacles.map((o) => o.name || 'Unnamed Obstacle'),
                );
                initializeGrid(FLOOR_SIZE, obstacles, 2, 3);
            }
        }, 100);

        return () => clearInterval(checkRefsInterval);
    }, [desksByTeam, officeObjectsRendered]);

    // Camera animation when builder mode changes
    useEffect(() => {
        if (orbitControlsRef.current) {
            const controls = orbitControlsRef.current;
            const camera = controls.object;

            if (isBuilderMode) {
                // Smooth transition to top-down view for builder mode
                const startPos = camera.position.clone();
                const endPos = new THREE.Vector3(0, 50, 0);
                const duration = 500; // ms
                const startTime = performance.now();

                const animateCamera = () => {
                    const elapsed = performance.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

                    camera.position.lerpVectors(startPos, endPos, eased);
                    camera.lookAt(0, 0, 0);
                    camera.updateProjectionMatrix();
                    controls.update();

                    if (progress < 1) {
                        requestAnimationFrame(animateCamera);
                    } else {
                        // Animation complete - now activate delayed builder mode
                        setAnimatingCamera(false);
                    }
                };

                animateCamera();
            } else {
                // Smooth transition back to standard perspective view
                const startPos = camera.position.clone();
                const endPos = new THREE.Vector3(0, 25, 30);
                const duration = 500; // ms
                const startTime = performance.now();

                const animateCamera = () => {
                    const elapsed = performance.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

                    camera.position.lerpVectors(startPos, endPos, eased);
                    camera.lookAt(0, 0, 0);
                    camera.updateProjectionMatrix();
                    controls.update();

                    if (progress < 1) {
                        requestAnimationFrame(animateCamera);
                    } else {
                        // Animation complete - now deactivate delayed builder mode
                        setAnimatingCamera(false);
                    }
                };

                animateCamera();
            }
        }
    }, [isBuilderMode]);

    const employeesForScene = useMemo(() => {
        // Assign random statuses to some employees
        const employeesWithStatus = assignRandomStatuses(employees);

        return employeesWithStatus.map((emp) => ({
            ...emp,
            position: emp.initialPosition,
        }));
    }, [employees]);
    const ceoDeskData = useMemo(
        () => desks.find((d) => d.team === 'CEO'),
        [desks],
    );

    const OfficeContainer = useMemo(() => {
        return <>
            <Box
                ref={floorRef}
                args={[FLOOR_SIZE, WALL_THICKNESS, FLOOR_SIZE]}
                position={[0, -WALL_THICKNESS / 2, 0]}
                receiveShadow
                name="floor"
            >
                <meshStandardMaterial color="lightgrey" />
            </Box>

            <Box
                args={[FLOOR_SIZE, WALL_HEIGHT, WALL_THICKNESS]}
                position={[0, WALL_HEIGHT / 2, -HALF_FLOOR]}
                castShadow
                receiveShadow
            >
                <meshStandardMaterial color="beige" />
            </Box>
            <Box
                args={[FLOOR_SIZE, WALL_HEIGHT, WALL_THICKNESS]}
                position={[0, WALL_HEIGHT / 2, HALF_FLOOR]}
                castShadow
                receiveShadow
            >
                <meshStandardMaterial color="beige" />
            </Box>
            <Box
                args={[WALL_THICKNESS, WALL_HEIGHT, FLOOR_SIZE + WALL_THICKNESS]}
                position={[-HALF_FLOOR, WALL_HEIGHT / 2, 0]}
                castShadow
                receiveShadow
            >
                <meshStandardMaterial color="beige" />
            </Box>
            <Box
                args={[WALL_THICKNESS, WALL_HEIGHT, FLOOR_SIZE + WALL_THICKNESS]}
                position={[HALF_FLOOR, WALL_HEIGHT / 2, 0]}
                castShadow
                receiveShadow
            >
                <meshStandardMaterial color="beige" />
            </Box>

        </>
    }, [])

    return (
        <>
            <ambientLight intensity={0.7} />
            <directionalLight
                position={[0, 20, 5]}
                intensity={1.5}
                castShadow
                shadow-mapSize-width={sceneBuilderMode ? 1024 : 2048} // Reduce shadow quality in builder mode
                shadow-mapSize-height={sceneBuilderMode ? 1024 : 2048}
                shadow-camera-far={50}
                shadow-camera-left={-HALF_FLOOR - 5}
                shadow-camera-right={HALF_FLOOR + 5}
                shadow-camera-top={HALF_FLOOR + 5}
                shadow-camera-bottom={-HALF_FLOOR - 5}
            />
            <pointLight position={[-10, 10, -10]} intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={0.3} />

            <OrbitControls
                ref={orbitControlsRef}
                enabled={!isDragging} // Disable controls while dragging an object
                enableRotate={!isDragging} // Always allow rotation
                enablePan={!isDragging} // Always allow panning
                enableZoom={true} // Always allow zoom
                maxPolarAngle={sceneBuilderMode ? Math.PI / 3 : Math.PI} // Limit rotation in builder mode
                minPolarAngle={sceneBuilderMode ? 0 : 0} // Allow looking straight down in builder mode
            />

            {OfficeContainer}

            {/* {Object.entries(desksByTeam).map(([teamName, teamDesks], index) => (
                <group
                    key={teamName}
                    ref={teamClusterRefs.current[index]}
                    name={`obstacle-cluster-${teamName}`}
                >
                    <TeamCluster
                        team={teamsByName[teamName]}
                        desks={teamDesks}
                        handleTeamClick={handleTeamClick}
                        companyId={companyId}
                    />
                </group>
            ))} */}

            {ceoDeskData && (
                <group ref={ceoDeskRef} name="obstacle-ceoDeskGroup">
                    <Desk
                        key={ceoDeskData.id}
                        deskId={ceoDeskData.id}
                        position={ceoDeskData.position}
                        rotationY={ceoDeskData.rotationY}
                        isHovered={false}
                    />
                </group>
            )}

            {/* Only render employees when NOT in builder mode for performance */}
            {!sceneBuilderMode && employeesForScene.map((emp) => (
                <Employee
                    key={emp._id}
                    {...emp}
                    onClick={handleEmployeeClick}
                    floorSize={FLOOR_SIZE}
                    debugMode={debugMode}
                    status={(emp.status || 'none') as StatusType}
                    statusMessage={emp.statusMessage}
                />
            ))}

            {/* Render office objects with refs for obstacle collection */}
            {officeObjectsRendered}

            <SmartGrid debugMode={debugMode} isBuilderMode={sceneBuilderMode} />
            {debugMode && <DestinationDebugger />}
        </>
    );
}

const OfficeScene = memo((props: SceneContentsProps) => {
    return (
        <Canvas
            shadows
            camera={{ position: [0, 25, 30], fov: 50 }}
            style={{ background: '#d0e0f0' }}
        >
            <SceneContents {...props} />
        </Canvas>
    );
});

OfficeScene.displayName = 'OfficeScene';
export default OfficeScene;
