'use client';

import { GridHelper } from 'three';
import { useThree } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import { useAppStore } from '@/lib/store/app-store';
import { getGridData } from '@/lib/pathfinding/a-star-pathfinding';
import { useEffect, useState } from 'react';
import * as THREE from 'three';

// Constants
const DEBUG_COLOR = 0xff0000; // Red for debug grid
const BUILDER_COLOR = 0x0000ff; // Blue for builder grid
const BOTH_COLOR = 0x9932cc; // Deep purple for both

// Define type for visualization data
interface GridCellVisual {
    key: string;
    position: THREE.Vector3Tuple;
    color: string;
    isWalkable: boolean;
}

interface UnifiedGridHelperProps {
    mode: 'debug' | 'builder' | 'both';
}

function UnifiedGridHelper({ mode }: UnifiedGridHelperProps) {
    const { scene } = useThree();
    const [grid, setGrid] = useState<THREE.GridHelper | null>(null);
    const [gridVisualData, setGridVisualData] = useState<GridCellVisual[]>([]);

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

    // Add walkable path visualization when debug mode is active
    useEffect(() => {
        const shouldShowWalkableCells = mode === 'debug' || mode === 'both';

        if (!shouldShowWalkableCells) {
            setGridVisualData([]);
            return;
        }

        const {
            gridWidth,
            gridDepth,
            cellSize,
            worldOffsetX,
            worldOffsetZ,
            walkableGrid,
        } = getGridData();

        if (!walkableGrid.length) {
            setGridVisualData([]);
            return; // Don't render if grid not initialized
        }

        const visuals: GridCellVisual[] = [];
        const gridYPosition = 0.02; // Slightly above the floor

        for (let x = 0; x < gridWidth; x++) {
            for (let z = 0; z < gridDepth; z++) {
                const isWalkable = walkableGrid[x][z];
                const worldX = x * cellSize - worldOffsetX + cellSize / 2;
                const worldZ = z * cellSize - worldOffsetZ + cellSize / 2;
                visuals.push({
                    key: `${x}-${z}`,
                    position: [worldX, gridYPosition, worldZ] as THREE.Vector3Tuple,
                    color: isWalkable ? 'lightgreen' : 'salmon',
                    isWalkable: isWalkable,
                });
            }
        }
        setGridVisualData(visuals);
    }, [mode]); // Re-create walkable cells when mode changes

    const { cellSize } = getGridData(); // Get cell size for box dimensions

    return (
        <group name="unifiedGridHelper">
            {/* Render walkable cell visualization when debug mode is active */}
            {gridVisualData.length > 0 && (
                <group name="walkablePathVisualization">
                    {gridVisualData.map((cell) => (
                        <Box
                            key={cell.key}
                            args={[cellSize * 0.9, 0.01, cellSize * 0.9]} // Slightly smaller boxes
                            position={cell.position}
                        >
                            {/* Use transparent material to see through */}
                            <meshBasicMaterial
                                color={cell.color}
                                opacity={cell.isWalkable ? 0.2 : 0.4} // Make walkable more transparent
                                transparent
                                depthWrite={false} // Don't occlude things below
                            />
                        </Box>
                    ))}
                </group>
            )}
        </group>
    );
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