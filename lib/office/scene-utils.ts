import { CEO_DESK_POS, CYLINDER_HEIGHT, DESK_DEPTH, DESK_WIDTH, EMPLOYEE_RADIUS, FLOOR_SIZE, HALF_FLOOR, NUM_EMPLOYEES, TEAM_NAMES, TEAMS_LAYOUT } from "@/constants";
import type { DeskLayoutData, EmployeeData, TeamData } from "@/lib/types";
import * as THREE from 'three';

// TODO: Move this to backend, we should run this when we create new teams and we need to restructure the office layout
export function generateTeamsWithDesks(): { teams: TeamData[], desks: DeskLayoutData[] } {
    console.log("Generating teams with desks...");
    const teams: TeamData[] = [];
    const deskLayout: DeskLayoutData[] = [];
    const deskSpacingX = DESK_WIDTH + 0.5;
    const deskSpacingZ = DESK_DEPTH + 1.5;
    let deskIdCounter = 0;

    for (const teamName of TEAM_NAMES) {
        const teamInfo = TEAMS_LAYOUT[teamName as keyof typeof TEAMS_LAYOUT];
        const clusterCenter = new THREE.Vector3(...teamInfo.clusterPos);
        const desksInCluster = teamInfo.size;
        const desksPerRow = 3;
        const teamDesks: string[] = [];

        for (let i = 0; i < desksInCluster; i++) {
            const row = Math.floor(i / desksPerRow);
            const col = i % desksPerRow;
            const x = (col - (desksPerRow - 1) / 2) * deskSpacingX;
            const z = (row === 0 ? -deskSpacingZ / 2 : deskSpacingZ / 2);
            const baseRotationY = (row === 0 ? 0 : Math.PI);
            const rotationY = baseRotationY + Math.PI;
            const deskPos = clusterCenter.clone().add(new THREE.Vector3(x, 0, z));
            const deskId = `desk-${teamName.replace(/\s+/g, '-')}-${deskIdCounter++}`;

            deskLayout.push({
                id: deskId,
                position: [deskPos.x, 0, deskPos.z],
                rotationY,
                team: teamName
            });
            teamDesks.push(deskId);
        }

        // Create TeamData object
        teams.push({
            _id: teamInfo.id,
            name: teamInfo.name,
            description: `${teamInfo.name} - A dynamic team working on various projects`,
            employees: [] // Will be populated when employees are generated
        });
    }

    // Add CEO desk
    deskLayout.push({
        id: 'desk-ceo-0',
        position: [...CEO_DESK_POS],
        rotationY: Math.PI * 2,
        team: 'Management'
    });

    // Add Management team
    teams.push({
        _id: 'team-management',
        name: 'Management',
        description: 'Executive leadership team',
        employees: []
    });

    return { teams, desks: deskLayout };
}

export function generateDesks(): DeskLayoutData[] {
    const { desks } = generateTeamsWithDesks();
    return desks;
}

export function generateEmployees(desks: ReadonlyArray<DeskLayoutData>): EmployeeData[] {
    // console.log("Generating employees...");
    const employeeData: EmployeeData[] = [];
    const availableDesks = desks.filter(d => d.team !== 'Management');
    const availableDeskIndices = new Set<number>(availableDesks.map((_, index) => index));
    const ceoDesk = desks.find(d => d.id === 'desk-ceo-0');
    if (!ceoDesk) {
        console.error("CEO Desk not found during employee generation!");
        return [];
    }
    const ceoForward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), ceoDesk.rotationY);
    const ceoOffset = ceoForward.multiplyScalar(DESK_DEPTH / 2 + EMPLOYEE_RADIUS + 0.2);
    const ceoPosition: [number, number, number] = [ceoDesk.position[0] + ceoOffset.x, CYLINDER_HEIGHT / 2, ceoDesk.position[2] + ceoOffset.z];
    employeeData.push({ _id: 'ceo-0', initialPosition: ceoPosition, isBusy: true, isCEO: true, name: "The Boss", team: "Management", deskId: ceoDesk.id });

    let employeeIdCounter = 1;
    const numRegularEmployees = Math.min(NUM_EMPLOYEES - 1, availableDesks.length);
    for (let i = 0; i < numRegularEmployees; i++) {
        const isBusy = Math.random() > 0.2;
        let employeePosition: [number, number, number];
        let assignedDesk: DeskLayoutData | null = null;
        if (isBusy && availableDeskIndices.size > 0) {
            const availableIndicesArray = Array.from(availableDeskIndices);
            const deskIndexToAssignGlobal = availableIndicesArray[Math.floor(Math.random() * availableIndicesArray.length)];
            availableDeskIndices.delete(deskIndexToAssignGlobal);
            assignedDesk = availableDesks[deskIndexToAssignGlobal];
            const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), assignedDesk.rotationY);
            const offset = forward.multiplyScalar(DESK_DEPTH / 2 + EMPLOYEE_RADIUS + 0.2);
            employeePosition = [assignedDesk.position[0] + offset.x, CYLINDER_HEIGHT / 2, assignedDesk.position[2] + offset.z];
        } else {
            let x: number;
            let z: number;
            do { x = Math.random() * FLOOR_SIZE - FLOOR_SIZE / 2; z = Math.random() * FLOOR_SIZE - FLOOR_SIZE / 2; } while (Math.abs(x) > HALF_FLOOR || Math.abs(z) > HALF_FLOOR);
            employeePosition = [x, CYLINDER_HEIGHT / 2, z];
        }
        employeeData.push({ _id: `emp-${employeeIdCounter++}`, initialPosition: employeePosition, isBusy: assignedDesk !== null, isCEO: false, name: `Employee ${employeeIdCounter - 1}`, team: assignedDesk?.team ?? TEAM_NAMES[i % TEAM_NAMES.length], deskId: assignedDesk?.id });
    }
    return employeeData;
}
