'use client';

import { GridHelper } from 'three';
import { useThree } from '@react-three/fiber';
import { useAppStore } from '@/lib/store/app-store';
import { getGridData } from '@/lib/pathfinding/a-star-pathfinding';
import { useEffect, useState } from 'react';
import * as THREE from 'three';

// Constants
const DEBUG_COLOR = 0xff0000; // Red for debug grid
const BUILDER_COLOR = 0x0000ff; // Blue for builder grid
const BOTH_COLOR = 0x9932cc; // Deep purple for both

interface UnifiedGridHelperProps {
    mode: 'debug' | 'builder' | 'both';
}

function UnifiedGridHelper({ mode }: UnifiedGridHelperProps) {
    const { scene } = useThree();
    const [grid, setGrid] = useState<THREE.GridHelper | null>(null);

    useEffect(() => {
        const gridData = getGridData();
        if (gridData.cellSize === 0) {
            console.warn("Grid not initialized, UnifiedGridHelper cannot render.");
            return;
        }

        const { gridWidth, cellSize } = gridData;
        const size = gridWidth * cellSize;
        const divisions = gridWidth;

        // Determine color based on mode
        let color: THREE.ColorRepresentation = DEBUG_COLOR;
        if (mode === 'builder') color = BUILDER_COLOR;
        if (mode === 'both') color = BOTH_COLOR;

        const newGrid = new THREE.GridHelper(size, divisions, color, color);
        newGrid.position.set(0, 0.01, 0); // Slightly above floor to prevent z-fighting

        // Clean up old grid if it exists
        if (grid) {
            scene.remove(grid);
            grid.dispose();
        }

        scene.add(newGrid);
        setGrid(newGrid);

        return () => {
            if (newGrid) {
                scene.remove(newGrid);
                newGrid.dispose();
            }
        };
    }, [mode, scene]); // Re-create grid when mode changes

    return null; // The helper is added directly to the scene, not returned as a component
}

interface SmartGridProps {
    debugMode: boolean;
    isBuilderMode: boolean;
}

export function SmartGrid({ debugMode, isBuilderMode }: SmartGridProps) {
    // Don't render if neither mode is active
    if (!debugMode && !isBuilderMode) return null;

    // Determine the appropriate mode
    let gridMode: 'debug' | 'builder' | 'both';
    if (debugMode && isBuilderMode) {
        gridMode = 'both';
    } else if (debugMode) {
        gridMode = 'debug';
    } else {
        gridMode = 'builder';
    }

    return <UnifiedGridHelper mode={gridMode} />;
}