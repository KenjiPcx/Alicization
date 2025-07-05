'use client';

import { Box, OrbitControls } from '@react-three/drei';
import { useMemo, memo, useRef, useEffect, createRef } from 'react';
import type * as THREE from 'three';
import { Canvas } from '@react-three/fiber';

import type { EmployeeData, DeskLayoutData, TeamData } from '@/lib/types';
import Plant from './objects/plant';
import Couch from './objects/couch';
import { Employee } from './objects/employee';
import Desk from './objects/desk';
import TeamCluster from './objects/team-cluster';
import Bookshelf from './objects/bookshelf';
import Pantry from './objects/pantry';
import {
    WALL_THICKNESS,
    WALL_HEIGHT,
    FLOOR_SIZE,
    PLANT_POSITIONS,
    CEO_OFFICE_WALLS,
    HALF_FLOOR,
} from '@/constants';
import { initializeGrid } from '@/lib/pathfinding/a-star-pathfinding';
import { AStarGridHelper } from './debug/a-star-grid-helper';
import { DestinationDebugger } from './debug/destination-debugger';
import type { StatusType } from './navigation/status-indicator';

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
        if (emp.isCEO) {
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
    handleEmployeeClick: (employee: EmployeeData) => void;
    handleTeamClick: (team: TeamData) => void;
    debugMode: boolean;
    teams: TeamData[];
    employees: EmployeeData[];
    desks: DeskLayoutData[];
}

function SceneContents({
    handleEmployeeClick,
    handleTeamClick,
    debugMode,
    teams,
    employees,
    desks,
}: SceneContentsProps) {
    const floorRef = useRef<THREE.Mesh>(null);
    const pantryRef = useRef<THREE.Group>(null);
    const bookshelfRef = useRef<THREE.Group>(null);
    const couchRef = useRef<THREE.Group>(null);
    const ceoDeskRef = useRef<THREE.Group>(null);

    const desksByTeam = useMemo(() => {
        const grouped: Record<string, Array<DeskLayoutData>> = {};
        for (const desk of desks) {
            if (desk.team === 'Management') continue;
            if (!grouped[desk.team]) {
                grouped[desk.team] = [];
            }
            grouped[desk.team].push(desk);
        }
        return grouped;
    }, [desks]);

    // Create a map of team names to team data for easy lookup
    const teamsByName = useMemo(() => {
        const teamMap: Record<string, TeamData> = {};
        for (const team of teams) {
            teamMap[team.name] = team;
        }
        return teamMap;
    }, [teams]);

    const teamClusterRefs = useRef<React.RefObject<THREE.Group | null>[]>([]);
    useMemo(() => {
        teamClusterRefs.current = Object.keys(desksByTeam).map(() =>
            createRef<THREE.Group>(),
        );
    }, [desksByTeam]);

    useEffect(() => {
        const checkRefsInterval = setInterval(() => {
            const obstacles: THREE.Object3D[] = [];
            if (pantryRef.current) obstacles.push(pantryRef.current);
            if (bookshelfRef.current) obstacles.push(bookshelfRef.current);
            if (couchRef.current) obstacles.push(couchRef.current);
            if (ceoDeskRef.current) obstacles.push(ceoDeskRef.current);

            for (const ref of teamClusterRefs.current) {
                if (ref?.current) {
                    obstacles.push(ref.current);
                }
            }

            const expectedStaticRefCount = 3;
            const expectedClusterCount = Object.keys(desksByTeam).length;
            let currentStaticCount = 0;
            if (pantryRef.current) currentStaticCount++;
            if (bookshelfRef.current) currentStaticCount++;
            if (couchRef.current) currentStaticCount++;
            if (ceoDeskRef.current) currentStaticCount++;
            const currentClusterCount = teamClusterRefs.current.filter(
                (ref) => ref?.current,
            ).length;

            if (
                currentStaticCount >= expectedStaticRefCount &&
                currentClusterCount === expectedClusterCount
            ) {
                clearInterval(checkRefsInterval);
                console.log('All Obstacle refs available, initializing A* grid...');
                console.log(
                    'Obstacles passed:',
                    obstacles.map((o) => o.name || 'Unnamed Cluster'),
                );
                initializeGrid(FLOOR_SIZE, obstacles, 2, 3);
            }
        }, 100);

        return () => clearInterval(checkRefsInterval);
    }, [desksByTeam]);

    const employeesForScene = useMemo(() => {
        // Assign random statuses to some employees
        const employeesWithStatus = assignRandomStatuses(employees);

        return employeesWithStatus.map((emp) => ({
            ...emp,
            position: emp.initialPosition,
        }));
    }, [employees]);
    const ceoDeskData = useMemo(
        () => desks.find((d) => d.team === 'Management'),
        [desks],
    );

    // console.log("Rendering SceneContents", { debugMode });

    return (
        <>
            <ambientLight intensity={0.7} />
            <directionalLight
                position={[15, 20, 10]}
                intensity={1.5}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-far={50}
                shadow-camera-left={-HALF_FLOOR - 5}
                shadow-camera-right={HALF_FLOOR + 5}
                shadow-camera-top={HALF_FLOOR + 5}
                shadow-camera-bottom={-HALF_FLOOR - 5}
            />
            <pointLight position={[-10, 10, -10]} intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={0.3} />

            <OrbitControls />

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

            {Object.entries(desksByTeam).map(([teamName, teamDesks], index) => (
                <group
                    key={teamName}
                    ref={teamClusterRefs.current[index]}
                    name={`obstacle-cluster-${teamName}`}
                >
                    <TeamCluster
                        team={teamsByName[teamName]}
                        desks={teamDesks}
                        handleTeamClick={handleTeamClick}
                    />
                </group>
            ))}

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

            {employeesForScene.map((emp) => (
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

            {PLANT_POSITIONS.map((pos) => (
                <Plant key={`plant-${pos.join(',')}`} position={pos} />
            ))}
            {CEO_OFFICE_WALLS.map((wall) => (
                <Box
                    key={`ceo-wall-${wall.position.join(',')}`}
                    args={wall.args as [number, number, number]}
                    position={wall.position}
                >
                    <meshStandardMaterial
                        color="lightblue"
                        opacity={0.3}
                        transparent
                        depthWrite={false}
                    />
                </Box>
            ))}
            <group ref={pantryRef} name="obstacle-pantryGroup">
                <Pantry position={[0, 0, -HALF_FLOOR + 1]} />
            </group>
            <group ref={bookshelfRef} name="obstacle-bookshelfGroup">
                <Bookshelf
                    position={[-10.25, 0, -HALF_FLOOR + 0.4 / 2]}
                    rotationY={0}
                />
            </group>
            <group ref={couchRef} name="obstacle-couchGroup">
                <Couch position={[10.25, 0, -HALF_FLOOR + 1.0 / 2]} rotationY={0} />
            </group>

            {debugMode && <AStarGridHelper />}
            {debugMode && <DestinationDebugger />}
        </>
    );
}

const OfficeScene = memo((props: SceneContentsProps) => {
    console.log('Rendering OfficeScene Wrapper');

    // Default to debug mode enabled if not explicitly provided
    const enhancedProps = {
        ...props,
        debugMode: props.debugMode !== undefined ? props.debugMode : true,
    };

    return (
        <Canvas
            shadows
            camera={{ position: [0, 25, 30], fov: 50 }}
            style={{ background: '#d0e0f0' }}
        >
            <SceneContents {...enhancedProps} />
        </Canvas>
    );
});

OfficeScene.displayName = 'OfficeScene';
export default OfficeScene;
