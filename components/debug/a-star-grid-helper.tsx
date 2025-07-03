'use client';

import { useEffect, useState } from 'react';
import { Box } from '@react-three/drei';
import type * as THREE from 'three';
import { getGridData } from '@/lib/pathfinding/a-star-pathfinding';

// Define type for visualization data
interface GridCellVisual {
  key: string;
  position: THREE.Vector3Tuple;
  color: string;
  isWalkable: boolean;
}

// Simple component to visualize the A* grid
export function AStarGridHelper() {
  const [gridVisualData, setGridVisualData] = useState<GridCellVisual[]>([]);

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
  }, []); // Run once on mount - assumes grid is initialized beforehand

  if (!gridVisualData.length) return null;

  const { cellSize } = getGridData(); // Get cell size for box dimensions

  return (
    <group name="aStarGridHelper">
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
  );
}
