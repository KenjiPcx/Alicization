import * as THREE from 'three';

// --- Constants ---
export const CYLINDER_HEIGHT = 0.8;
export const DESK_WIDTH = 2;
export const DESK_DEPTH = 1;
export const DESK_HEIGHT = 0.5;
export const COMPUTER_HEIGHT = 0.4;
export const EMPLOYEE_RADIUS = 0.2;
export const WALL_HEIGHT = 2.5;
export const WALL_THICKNESS = 0.2;

// --- Layout & Config Constants ---
export const NUM_EMPLOYEES = 25;
export const FLOOR_SIZE = 35;
export const FLOOR_SIZE_FOR_DECOR = 35;
export const HALF_FLOOR = FLOOR_SIZE_FOR_DECOR / 2;

export const TEAMS_LAYOUT = {
    "Team Alpha": {
        id: "team-alpha",
        name: "Team Alpha",
        employees: [],
        clusterPos: [-12, 0, -5],
        size: 6,
        desks: [],
    },
    "Team Bravo": {
        id: "team-bravo",
        name: "Team Bravo",
        employees: [],
        clusterPos: [0, 0, -5],
        size: 6,
        desks: [],
    },
    "Team Charlie": {
        id: "team-charlie",
        name: "Team Charlie", 
        employees: [],
        clusterPos: [12, 0, -5],
        size: 6,
        desks: [],
    },
    "Team Delta": {
        id: "team-delta",
        name: "Team Delta",
        employees: [],
        clusterPos: [-12, 0, 5],
        size: 6,
        desks: [],
    },
    "Team Echo": {
        id: "team-echo",
        name: "Team Echo",
        employees: [],
        clusterPos: [0, 0, 5],
        size: 6,
        desks: [],
    },
    "Team Foxtrot": {
        id: "team-foxtrot",
        name: "Team Foxtrot",
        employees: [],
        clusterPos: [12, 0, 5],
        size: 6,
        desks: [],
    },
}
export const TEAM_NAMES = Object.keys(TEAMS_LAYOUT);

export const PLANT_POSITIONS: [number, number, number][] = [
    [-HALF_FLOOR + 1, 0, -HALF_FLOOR + 1],
    [HALF_FLOOR - 1, 0, -HALF_FLOOR + 1],
    [-HALF_FLOOR + 1, 0, HALF_FLOOR - 1],
    [HALF_FLOOR - 1, 0, HALF_FLOOR - 1],
    [-HALF_FLOOR + 1, 0, 0],
    [HALF_FLOOR - 1, 0, 0],
];

export const COUCH_POSITION: [number, number, number] = [0, 0, -HALF_FLOOR + 1];
export const COUCH_ROTATION_Y = 0;

export const CEO_OFFICE_WALLS = [
    { position: [-3, WALL_HEIGHT / 2, 15] as [number, number, number], args: [WALL_THICKNESS, WALL_HEIGHT, 5] as [number, number, number] },
    { position: [3, WALL_HEIGHT / 2, 15] as [number, number, number], args: [WALL_THICKNESS, WALL_HEIGHT, 5] as [number, number, number] },
    { position: [0, WALL_HEIGHT / 2, 12.5] as [number, number, number], args: [6, WALL_HEIGHT, WALL_THICKNESS] as [number, number, number] },
];

export const CEO_DESK_POS = [0, 0, 15] as [number, number, number];

// --- Employee Constants ---
// --- Color Palettes ---
export const HAIR_COLORS = ["#000000", "#A52A2A", "#D2691E", "#FFD700", "#C0C0C0"]; // Black, Brown, Chocolate, Gold, Silver
export const SKIN_COLORS = ["#F5F5DC", "#FFE4C4", "#FFDBAC", "#F5DEB3", "#D2B48C", "#CD853F"]; // Beige, Bisque, BlanchedAlmond, Wheat, Tan, Peru
export const SHIRT_COLORS = ["#FF0000", "#0000FF", "#008000", "#FFFF00", "#FFA500", "#800080", "#FFFFFF", "#808080"]; // Red, Blue, Green, Yellow, Orange, Purple, White, Gray
export const PANTS_COLORS = ["#00008B", "#2F4F4F", "#000000", "#A0522D", "#808080"]; // DarkBlue, DarkSlateGray, Black, Sienna, Gray

// Define block dimensions
export const BODY_WIDTH = EMPLOYEE_RADIUS * 2;
export const LEG_HEIGHT = 0.35;
export const BODY_HEIGHT = 0.35;
export const HEAD_HEIGHT = 0.2;
export const HAIR_HEIGHT = 0.05;
export const TOTAL_HEIGHT = LEG_HEIGHT + BODY_HEIGHT + HEAD_HEIGHT + HAIR_HEIGHT;
export const HEAD_WIDTH = BODY_WIDTH * 0.8;
export const HAIR_WIDTH = HEAD_WIDTH * 1.05; // Slightly wider than head

// --- Define potential destinations --- Needs refinement based on actual object positions
export const IDLE_DESTINATIONS: THREE.Vector3[] = [
    new THREE.Vector3(0, 0, -HALF_FLOOR + 2), // Near Pantry center
    new THREE.Vector3(-5, 0, -HALF_FLOOR + 2), // Near Pantry left
    new THREE.Vector3(5, 0, -HALF_FLOOR + 2), // Near Pantry right
    new THREE.Vector3(10.25, 0, -HALF_FLOOR + 2), // Near Couch
    new THREE.Vector3(-10.25, 0, -HALF_FLOOR + 1), // Near Bookshelf
    new THREE.Vector3(0, 0, 0), // Centerish
    new THREE.Vector3(10, 0, 10), // Corner area
    new THREE.Vector3(-10, 0, 10), // Corner area
];