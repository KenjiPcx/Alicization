'use client';

import { useEffect, useState } from 'react';
import { Box } from '@react-three/drei';
import type * as THREE from 'three';
import { getGridData } from '@/lib/pathfinding/a-star-pathfinding';
import { useAppStore } from '@/lib/store/app-store';

// Define type for visualization data
interface GridCellVisual {
    key: string;
    position: THREE.Vector3Tuple;
    color: string;
    isWalkable: boolean;
}

interface UnifiedGridHelperProps {
    mode: 'debug' | 'builder' | 'both';
    yOffset?: number;
    opacity?: {
        walkable: number;
        blocked: number;
    };
    colors?: {
        walkable: string;
        blocked: string;
        debugWalkable?: string;
        debugBlocked?: string;
    };
}

// Smart component that efficiently renders one grid with multiple information layers
export function UnifiedGridHelper({
    mode = 'debug',
    yOffset,
    opacity,
    colors
}: UnifiedGridHelperProps) {
    const [gridVisualData, setGridVisualData] = useState<GridCellVisual[]>([]);

    // Default configurations for different modes
    const defaultConfigs = {
        debug: {
            yOffset: 0.02,
            opacity: { walkable: 0.2, blocked: 0.4 },
            colors: {
                walkable: 'lightgreen',
                blocked: 'salmon',
                debugWalkable: 'lightgreen',
                debugBlocked: 'salmon'
            }
        },
        builder: {
            yOffset: 0.015,
            opacity: { walkable: 0.15, blocked: 0.3 },
            colors: {
                walkable: '#444444',
                blocked: '#666666',
                debugWalkable: 'lightgreen',
                debugBlocked: 'salmon'
            }
        },
        both: {
            yOffset: 0.015,
            opacity: { walkable: 0.25, blocked: 0.45 },
            colors: {
                walkable: '#22c55e', // Green tint for walkable + builder mode
                blocked: '#ef4444', // Red tint for blocked + builder mode 
                debugWalkable: '#22c55e',
                debugBlocked: '#ef4444'
            }
        }
    };

    const config = {
        yOffset: yOffset ?? defaultConfigs[mode].yOffset,
        opacity: opacity ?? defaultConfigs[mode].opacity,
        colors: colors ?? defaultConfigs[mode].colors
    };

    useEffect(() => {
        const {
            gridWidth,
            gridDepth,
            cellSize,
            worldOffsetX,
            worldOffsetZ,
            walkableGrid,
        } = getGridData();

        if (!walkableGrid.length) return; // Don't render if grid not initialized

        const visuals: GridCellVisual[] = [];

        for (let x = 0; x < gridWidth; x++) {
            for (let z = 0; z < gridDepth; z++) {
                const isWalkable = walkableGrid[x][z];
                const worldX = x * cellSize - worldOffsetX + cellSize / 2;
                const worldZ = z * cellSize - worldOffsetZ + cellSize / 2;

                // Choose color based on mode
                let cellColor: string;
                if (mode === 'both') {
                    // Mixed mode: more vibrant colors to show both debug and builder info
                    cellColor = isWalkable ? config.colors.debugWalkable! : config.colors.debugBlocked!;
                } else if (mode === 'debug') {
                    cellColor = isWalkable ? config.colors.debugWalkable! : config.colors.debugBlocked!;
                } else {
                    cellColor = isWalkable ? config.colors.walkable : config.colors.blocked;
                }

                visuals.push({
                    key: `${x}-${z}`,
                    position: [worldX, config.yOffset, worldZ] as THREE.Vector3Tuple,
                    color: cellColor,
                    isWalkable: isWalkable,
                });
            }
        }
        setGridVisualData(visuals);
    }, [mode, config.yOffset, config.colors.walkable, config.colors.blocked, config.colors.debugWalkable, config.colors.debugBlocked]); // Re-run when config or mode changes

    if (!gridVisualData.length) return null;

    const { cellSize } = getGridData(); // Get cell size for box dimensions

    return (
        <group name={`unifiedGridHelper-${mode}`}>
            {gridVisualData.map((cell) => (
                <Box
                    key={cell.key}
                    args={[cellSize * 0.9, 0.01, cellSize * 0.9]} // Consistent flat boxes
                    position={cell.position}
                >
                    <meshBasicMaterial
                        color={cell.color}
                        opacity={cell.isWalkable ? config.opacity.walkable : config.opacity.blocked}
                        transparent
                        depthWrite={false} // Don't occlude things below
                    />
                </Box>
            ))}
        </group>
    );
}

// Smart grid component that automatically chooses the right mode based on app state
export function SmartGrid() {
    const { debugMode, isBuilderMode } = useAppStore();

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

// Backwards compatibility exports
export function AStarGridHelper() {
    return <UnifiedGridHelper mode="debug" />;
}

export function BuilderGrid() {
    return <UnifiedGridHelper mode="builder" />;
} 