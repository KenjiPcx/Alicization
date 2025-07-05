// Utility function to calculate desk position for an employee
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

    // Special case for single desk (CEO) - center it
    if (totalDesks === 1) {
        return [clusterPosition[0], 0, clusterPosition[2]];
    }

    const row = Math.floor(deskIndex / desksPerRow);
    const col = deskIndex % desksPerRow;

    const x = clusterPosition[0] + (col - (desksPerRow - 1) / 2) * deskSpacingX;
    const y = 0;
    const z = clusterPosition[2] + (row === 0 ? -deskSpacingZ / 2 : deskSpacingZ / 2);

    return [x, y, z];
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
