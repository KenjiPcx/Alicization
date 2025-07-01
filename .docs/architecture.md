# Office Simulation Architecture

## Overview

This application simulates an interactive office environment with autonomous AI agents represented as employees. Based on a WeWork-style floor plan, it features a 3D visualization of office spaces where employees move around, work at desks, and display status indicators.

The primary goal is to create a virtual office where AI agents (employees) can perform tasks, collaborate, and respond to user input. The system is built using React, TypeScript, and Three.js (via React Three Fiber) for 3D rendering.

## Core Concepts

### Agents and Simulation

The simulation revolves around autonomous employees who can:
- Navigate the office using A* pathfinding
- Display status indicators with messages
- Interact with office furniture and spaces
- Follow designated behaviors (working at desks, wandering while idle)

### 3D Visualization

The office is rendered as a 3D environment with:
- Desks, chairs, and office equipment
- Wall boundaries and room divisions
- Teams grouped in clusters
- Plants and decorative elements
- Specialized areas like pantry and bookshelf

### Navigation System

Employees move through the office using:
- A* pathfinding algorithm for optimal routes
- Obstacle detection and avoidance
- Destination management to prevent collisions
- Idle wandering behaviors

### Status Indicators

Employees display their current status through:
- Floating 3D indicators above their heads
- Status-specific icons (info, success, question, warning)
- Message bubbles that show detailed information
- Auto-hiding messages that can be revealed on click

## Directory Structure

```
src/
├── components/            # UI and visual components
│   ├── debug/             # Debug visualization tools
│   ├── navigation/        # Pathfinding and movement visualization
│   ├── objects/           # 3D objects for the office environment
│   ├── ui/                # User interface components
│   ├── office-scene.tsx   # Main 3D scene component
│   └── office-simulation.tsx  # Simulation controller
├── lib/                   # Core functionality and utilities
│   ├── pathfinding/       # Navigation and pathfinding algorithms
│   ├── scene-utils.ts     # Scene generation utilities
│   └── utils.ts           # General utilities
├── types/                 # TypeScript type definitions
├── constants.ts           # Global constants and configuration
└── main.tsx               # Application entry point
```

## Key Components

### Scene Components

- **office-scene.tsx**: The main 3D environment renderer
  - Manages the canvas, lighting, and camera
  - Renders all office objects and employees
  - Initializes the navigation grid based on obstacles

- **office-simulation.tsx**: Controls the overall simulation flow
  - Manages simulation time and updates
  - Handles user interaction with the scene
  - Coordinates between UI and 3D scene

### Office Objects

The `components/objects/` directory contains individual 3D objects:

- **desk.tsx**: Office desks with computers
- **employee.tsx**: Employee avatars with movement and status
- **team-cluster.tsx**: Groupings of desks for team organization
- **pantry.tsx**, **bookshelf.tsx**, **couch.tsx**, **plant.tsx**: Additional office furnishings

### Navigation System

Located in `lib/pathfinding/`:

- **a-star-pathfinding.ts**: Implementation of A* algorithm for finding optimal paths
- **destination-registry.ts**: Management of employee destinations to prevent conflicts
- **pathfinding.ts**: Core pathfinding utilities and interfaces

Complemented by visualization components:

- **path-visualizer.tsx**: Visual debugging of employee paths
- **nav-mesh.tsx**: Navigation mesh representation

### Status System

- **status-indicator.tsx**: Floating status indicators above employees
  - Displays different icons based on status type (info, success, question, warning)
  - Shows message bubbles that auto-hide after a period
  - Supports interactivity to reveal hidden messages

## Data Flow

1. The simulation is initialized in `office-simulation.tsx`
2. Office layout and employees are generated in `scene-utils.ts`
3. Navigation grid is created based on office objects and obstacles
4. Employees are assigned starting positions, statuses, and behaviors
5. During simulation:
   - Employees navigate using A* pathfinding
   - Status indicators display employee states
   - User interactions trigger appropriate responses

## Implementation Details

### A* Pathfinding

The A* algorithm calculates optimal paths for employees, handling:
- Grid-based navigation with variable resolutions
- Obstacle avoidance with appropriate padding
- Path smoothing and optimization
- Destination registration to prevent multiple employees targeting the same spot

### Employee Behavior

Employees exhibit different behaviors:
- When busy: Return to and remain at desk
- When idle: Wander to random destinations, wait, then move again
- During movement: Follow calculated paths with smooth transitions

### Status Indicators

Status indicators provide visual feedback:
- 3D icons float above employees' heads
- Status types (info, success, question, warning) have unique visuals
- Messages appear in colored bubbles matching the status type
- Messages auto-hide after 60 seconds but can be revealed again by clicking the icon

## Future Extensions

The architecture is designed to be extensible for future features:
- More complex employee behaviors and interactions
- Team-based activities and collaborations
- Task assignment and completion tracking
- Performance metrics and visualization
- Additional office spaces and furnishings
