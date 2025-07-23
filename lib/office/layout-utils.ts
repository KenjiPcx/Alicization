// Utility function to calculate desk position relative to cluster center
export function getDeskPosition(
    clusterPosition: number[],
    deskIndex: number,
    totalDesks: number
): [number, number, number] {
    const DESK_WIDTH = 2;
    const DESK_DEPTH = 1;
    const deskSpacingX = DESK_WIDTH + 0.5;
    const deskSpacingZ = DESK_DEPTH + 1.5;
    const desksPerRow = 3;

    // Special case for single desk (CEO) - center it at origin
    if (totalDesks === 1) {
        return [0, 0, 0];
    }

    const row = Math.floor(deskIndex / desksPerRow);
    const col = deskIndex % desksPerRow;

    // Return positions relative to cluster center (0,0,0)
    const x = (col - (desksPerRow - 1) / 2) * deskSpacingX;
    const y = 0;
    const z = (row === 0 ? -deskSpacingZ / 2 : deskSpacingZ / 2);

    return [x, y, z];
}

// Utility function to get absolute desk position in world space
export function getAbsoluteDeskPosition(
    clusterPosition: number[],
    deskIndex: number,
    totalDesks: number
): [number, number, number] {
    const relativePosition = getDeskPosition(clusterPosition, deskIndex, totalDesks);
    return [
        clusterPosition[0] + relativePosition[0],
        clusterPosition[1] + relativePosition[1],
        clusterPosition[2] + relativePosition[2]
    ];
}

// Get desk rotation for an employee
export function getDeskRotation(deskIndex: number, totalDesks?: number): number {
    // Special case for single desk (CEO) - facing forward (towards negative Z)
    if (totalDesks === 1) {
        return Math.PI * 2; // Same as 0, facing forward
    }

    const desksPerRow = 3;
    const row = Math.floor(deskIndex / desksPerRow);
    return row === 0 ? Math.PI : 0;
}

// Calculate employee position relative to desk (with offset to prevent overlapping)
export function getEmployeePositionAtDesk(
    deskPosition: [number, number, number],
    deskRotation: number
): [number, number, number] {
    const DESK_DEPTH = 1;
    const EMPLOYEE_RADIUS = 0.2;
    const CYLINDER_HEIGHT = 0.8;

    // Calculate forward vector based on desk rotation
    const forwardX = Math.sin(deskRotation);
    const forwardZ = Math.cos(deskRotation);

    // Calculate offset from desk center
    const offset = (DESK_DEPTH / 2 + EMPLOYEE_RADIUS + 0.2);

    return [
        deskPosition[0] + forwardX * offset,
        CYLINDER_HEIGHT / 2,
        deskPosition[2] + forwardZ * offset
    ];
}
