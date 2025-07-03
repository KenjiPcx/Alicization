import * as THREE from 'three';
import { Pathfinding, type PathfindingHelper } from 'three-pathfinding';

// --- Grid Configuration ---
const CELL_SIZE = 0.5; // Size of each grid cell in world units
// Add padding for obstacles (in grid cells)
const OBSTACLE_PADDING = 1; // Default padding for obstacles (1 cell = 0.5 units)
const DESK_PADDING = 4;     // Extra padding for desk clusters (4 cells = 2.0 units)
let gridWidth = 0;
let gridDepth = 0;
let worldOffsetX = 0;
let worldOffsetZ = 0;
let walkableGrid: boolean[][] = [];
let currentObstaclePadding = OBSTACLE_PADDING; // Track current obstacle padding
let currentDeskPadding = DESK_PADDING; // Track current desk padding

// --- Getters for Grid Data (for visualization) ---
export const getGridData = () => ({
    gridWidth,
    gridDepth,
    cellSize: CELL_SIZE,
    worldOffsetX,
    worldOffsetZ,
    walkableGrid,
    obstaclePadding: currentObstaclePadding,
    deskPadding: currentDeskPadding,
});

// --- A* Node ---
class PathNode {
    x: number;
    z: number;
    gCost = Number.POSITIVE_INFINITY; // Cost from start node
    hCost = 0;       // Heuristic cost to end node
    fCost = Number.POSITIVE_INFINITY; // gCost + hCost
    parent: PathNode | null = null;
    isWalkable = true;

    constructor(x: number, z: number, isWalkable = true) {
        this.x = x;
        this.z = z;
        this.isWalkable = isWalkable;
    }
}

// --- Grid Initialization ---
/**
 * Initializes the walkable grid based on floor dimensions and obstacles.
 * Now with added padding around obstacles for more natural movement.
 * @param floorSize Total size of the floor (width/depth).
 * @param obstacles Array of THREE.Object3D representing obstacles.
 * @param obstaclePadding Optional: Override the default obstacle padding.
 * @param deskPadding Optional: Override the default desk cluster padding.
 */
export function initializeGrid(
    floorSize: number,
    obstacles: THREE.Object3D[],
    obstaclePadding?: number,
    deskPadding?: number
) {
    // Use provided padding values or defaults
    currentObstaclePadding = obstaclePadding !== undefined ? obstaclePadding : OBSTACLE_PADDING;
    currentDeskPadding = deskPadding !== undefined ? deskPadding : DESK_PADDING;

    gridWidth = Math.ceil(floorSize / CELL_SIZE);
    gridDepth = Math.ceil(floorSize / CELL_SIZE);
    worldOffsetX = floorSize / 2;
    worldOffsetZ = floorSize / 2;
    walkableGrid = Array(gridWidth).fill(null).map(() => Array(gridDepth).fill(true));

    console.log(`Initializing A* grid: ${gridWidth}x${gridDepth} (Cell size: ${CELL_SIZE})`);
    console.log(`Using obstacle padding: ${currentObstaclePadding} cells, desk padding: ${currentDeskPadding} cells`);

    // 1. Mark walls (outer boundaries) with extra padding to keep agents away from edges
    const boundaryPadding = Math.max(2, currentObstaclePadding);
    for (let i = 0; i < gridWidth; i++) {
        for (let j = 0; j < boundaryPadding; j++) {
            // Mark boundary cells as unwalkable with padding
            if (j < gridDepth) walkableGrid[j][i] = false; // Left boundary
            if (gridWidth - 1 - j < gridWidth && gridWidth - 1 - j >= 0) walkableGrid[gridWidth - 1 - j][i] = false; // Right boundary
            if (i < gridWidth) walkableGrid[i][j] = false; // Bottom boundary
            if (i < gridWidth && gridDepth - 1 - j < gridDepth && gridDepth - 1 - j >= 0) walkableGrid[i][gridDepth - 1 - j] = false; // Top boundary
        }
    }

    // 2. Mark furniture/desk obstacles with padding
    for (const obstacle of obstacles) {
        // Get obstacle's world position for logging
        const position = new THREE.Vector3();
        obstacle.getWorldPosition(position);

        // Get obstacle's bounding box in world space
        const box = new THREE.Box3().setFromObject(obstacle, true);

        // Convert box bounds to grid coordinates
        const min = worldToGrid(box.min.x, box.min.z);
        const max = worldToGrid(box.max.x, box.max.z);

        // Choose padding based on obstacle type
        // Use more padding for desks to make paths look more natural
        let padding = currentObstaclePadding;

        // Check if this is a desk or desk cluster based on name
        const isProbablyDesk = obstacle.name?.includes('cluster') || obstacle.name?.includes('Desk');
        if (isProbablyDesk) {
            padding = currentDeskPadding;
            // console.log(`Using larger padding (${padding} cells) for desk object: ${obstacle.name}`);
        }

        // console.log(`Marking obstacle: ${obstacle.name || 'Unnamed'} at position: ${position.x.toFixed(2)}, ${position.z.toFixed(2)} with padding: ${padding}`);

        if (obstacle.userData?.footprint) {
            // If the obstacle defines its own footprint, use that
            const footprint = obstacle.userData.footprint;
            for (const point of footprint) {
                const fpX = Math.floor((point.x + floorSize / 2) / CELL_SIZE);
                const fpZ = Math.floor((point.z + floorSize / 2) / CELL_SIZE);
                markObstacle(fpX, fpZ, padding);
            }
        } else {
            // Apply padding: expand the obstacle bounds in all directions
            const paddedMin = {
                x: Math.max(0, min.x - padding),
                z: Math.max(0, min.z - padding)
            };

            const paddedMax = {
                x: Math.min(gridWidth - 1, max.x + padding),
                z: Math.min(gridDepth - 1, max.z + padding)
            };

            // Mark cells as non-walkable, including the padding area
            for (let x = paddedMin.x; x <= paddedMax.x; x++) {
                for (let z = paddedMin.z; z <= paddedMax.z; z++) {
                    if (x >= 0 && x < gridWidth && z >= 0 && z < gridDepth) {
                        walkableGrid[x][z] = false;
                    }
                }
            }

            // console.log(`Marked obstacle at grid [${min.x}-${max.x}, ${min.z}-${max.z}] ` +
            //     `with padding [${paddedMin.x}-${paddedMax.x}, ${paddedMin.z}-${paddedMax.z}]`);
        }
    }

    // Ensure there are still walkable cells after padding (emergency check)
    let walkableCellCount = 0;
    for (let x = 0; x < gridWidth; x++) {
        for (let z = 0; z < gridDepth; z++) {
            if (walkableGrid[x][z]) walkableCellCount++;
        }
    }

    // console.log(`A* grid initialized with ${walkableCellCount} walkable cells (${(walkableCellCount / (gridWidth * gridDepth) * 100).toFixed(1)}% of total)`);

    // Warning if too few walkable cells
    if (walkableCellCount < (gridWidth * gridDepth) * 0.2) {
        console.warn('Very few walkable cells left after padding! Employees may have trouble finding paths.');
    }
}

// --- Coordinate Conversion ---
export function worldToGrid(worldX: number, worldZ: number): { x: number, z: number } {
    const gridX = Math.floor((worldX + worldOffsetX) / CELL_SIZE);
    const gridZ = Math.floor((worldZ + worldOffsetZ) / CELL_SIZE);
    return {
        x: Math.max(0, Math.min(gridWidth - 1, gridX)),
        z: Math.max(0, Math.min(gridDepth - 1, gridZ))
    };
}

export function gridToWorld(gridX: number, gridZ: number): THREE.Vector3 {
    const worldX = gridX * CELL_SIZE - worldOffsetX + CELL_SIZE / 2;
    const worldZ = gridZ * CELL_SIZE - worldOffsetZ + CELL_SIZE / 2;
    return new THREE.Vector3(worldX, 0, worldZ);
}

// --- A* Algorithm ---
/**
 * Finds the shortest path using A*.
 * @param startWorldPos World position of the start.
 * @param endWorldPos World position of the end.
 * @returns Array of world positions (Vector3) representing the path, or null if no path found.
 */
export function findPathAStar(startWorldPos: THREE.Vector3, endWorldPos: THREE.Vector3): THREE.Vector3[] | null {
    if (!walkableGrid.length) {
        console.error("A* grid not initialized.");
        return null;
    }

    const startGrid = worldToGrid(startWorldPos.x, startWorldPos.z);
    const endGrid = worldToGrid(endWorldPos.x, endWorldPos.z);

    // Check if start/end nodes are valid *before* creating PathNode instances
    if (!walkableGrid[startGrid.x]?.[startGrid.z] || !walkableGrid[endGrid.x]?.[endGrid.z]) {
        // console.warn(`A*: Start (${startGrid.x},${startGrid.z}) or End (${endGrid.x},${endGrid.z}) node is not walkable.`);
        // Try finding the nearest walkable node (simple approach)
        const nearestStart = findNearestWalkable(startGrid.x, startGrid.z);
        const nearestEnd = findNearestWalkable(endGrid.x, endGrid.z);
        if (!nearestStart || !nearestEnd) {
            console.error("A*: Could not find nearby walkable nodes for start/end.");
            return null;
        }
        startGrid.x = nearestStart.x;
        startGrid.z = nearestStart.z;
        endGrid.x = nearestEnd.x;
        endGrid.z = nearestEnd.z;
        // console.log(`A*: Adjusted start/end to nearest walkable: Start (${startGrid.x},${startGrid.z}), End (${endGrid.x},${endGrid.z})`);
    }

    const startNode = new PathNode(startGrid.x, startGrid.z, true);
    const endNode = new PathNode(endGrid.x, endGrid.z, true);

    const openSet = new Set<PathNode>();
    const closedSet = new Set<string>();
    const nodeMap: PathNode[][] = Array(gridWidth).fill(null).map(() => Array(gridDepth));

    function getNode(x: number, z: number): PathNode {
        if (!nodeMap[x]) nodeMap[x] = [];
        if (!nodeMap[x][z]) nodeMap[x][z] = new PathNode(x, z, walkableGrid[x][z]);
        return nodeMap[x][z];
    }

    startNode.gCost = 0;
    startNode.hCost = heuristic(startNode, endNode);
    startNode.fCost = startNode.gCost + startNode.hCost;
    openSet.add(startNode);
    nodeMap[startGrid.x][startGrid.z] = startNode;

    while (openSet.size > 0) {
        const currentNode = getLowestFCostNode(openSet);
        if (!currentNode) break; // Should not happen if openSet is not empty, but safety check

        if (currentNode.x === endNode.x && currentNode.z === endNode.z) {
            return reconstructPath(currentNode);
        }

        openSet.delete(currentNode);
        closedSet.add(`${currentNode.x},${currentNode.z}`);

        for (const neighborData of getNeighbors(currentNode)) {
            const neighborNode = getNode(neighborData.x, neighborData.z);
            if (!neighborNode.isWalkable || closedSet.has(`${neighborNode.x},${neighborNode.z}`)) continue;

            const tentativeGCost = currentNode.gCost + neighborData.cost;
            if (tentativeGCost < neighborNode.gCost) {
                neighborNode.parent = currentNode;
                neighborNode.gCost = tentativeGCost;
                neighborNode.hCost = heuristic(neighborNode, endNode);
                neighborNode.fCost = neighborNode.gCost + neighborNode.hCost;
                if (!openSet.has(neighborNode)) openSet.add(neighborNode);
            }
        }
    }

    console.warn(`A*: No path found from (${startGrid.x},${startGrid.z}) to (${endGrid.x},${endGrid.z})`);
    return null;
}

// --- A* Helpers ---
function heuristic(nodeA: PathNode, nodeB: PathNode): number {
    const dx = Math.abs(nodeA.x - nodeB.x);
    const dz = Math.abs(nodeA.z - nodeB.z);
    return (dx + dz);
}

function getLowestFCostNode(nodeSet: Set<PathNode>): PathNode | null {
    let lowestFCostNode: PathNode | null = null;
    for (const node of nodeSet) {
        if (lowestFCostNode === null || node.fCost < lowestFCostNode.fCost) {
            lowestFCostNode = node;
        }
    }
    return lowestFCostNode;
}

function getNeighbors(node: PathNode): { x: number, z: number, cost: number }[] {
    const neighbors: { x: number, z: number, cost: number }[] = [];
    const dirs = [
        { x: 0, z: 1, cost: 1 }, { x: 0, z: -1, cost: 1 },
        { x: 1, z: 0, cost: 1 }, { x: -1, z: 0, cost: 1 },
    ];
    for (const dir of dirs) {
        const neighborX = node.x + dir.x;
        const neighborZ = node.z + dir.z;
        if (neighborX >= 0 && neighborX < gridWidth && neighborZ >= 0 && neighborZ < gridDepth) {
            if (walkableGrid[neighborX][neighborZ]) {
                neighbors.push({ x: neighborX, z: neighborZ, cost: dir.cost });
            }
        }
    }
    return neighbors;
}

function reconstructPath(endNode: PathNode): THREE.Vector3[] {
    const path: THREE.Vector3[] = [];
    let currentNode: PathNode | null = endNode;
    while (currentNode !== null) {
        path.push(gridToWorld(currentNode.x, currentNode.z));
        currentNode = currentNode.parent;
    }
    return path.reverse();
}

// Helper to find nearest walkable node (simple spiral search)
function findNearestWalkable(startX: number, startZ: number): { x: number, z: number } | null {
    if (walkableGrid[startX]?.[startZ]) return { x: startX, z: startZ };

    const maxRadius = Math.max(gridWidth, gridDepth);
    for (let r = 1; r < maxRadius; r++) {
        for (let dx = -r; dx <= r; dx++) {
            for (let dz = -r; dz <= r; dz++) {
                if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue; // Only check perimeter
                const checkX = startX + dx;
                const checkZ = startZ + dz;
                if (checkX >= 0 && checkX < gridWidth && checkZ >= 0 && checkZ < gridDepth) {
                    if (walkableGrid[checkX][checkZ]) {
                        return { x: checkX, z: checkZ };
                    }
                }
            }
        }
    }
    return null; // Should not happen if grid has walkable cells
}

/**
 * Helper function to mark a cell and surrounding area as obstacles
 */
function markObstacle(centerX: number, centerZ: number, padding: number) {
    // Ensure the center point is within grid bounds
    if (centerX < 0 || centerX >= gridWidth || centerZ < 0 || centerZ >= gridDepth) {
        return;
    }

    // Mark the center cell as unwalkable
    walkableGrid[centerX][centerZ] = false;

    // Mark cells within padding distance as unwalkable
    for (let dx = -padding; dx <= padding; dx++) {
        for (let dz = -padding; dz <= padding; dz++) {
            const x = centerX + dx;
            const z = centerZ + dz;

            // Skip if out of bounds
            if (x < 0 || x >= gridWidth || z < 0 || z >= gridDepth) {
                continue;
            }

            // Mark the cell as unwalkable
            walkableGrid[x][z] = false;
        }
    }
} 