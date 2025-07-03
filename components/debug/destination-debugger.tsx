import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { getActiveDestinations } from '@/lib/pathfinding/destination-registry';

export function DestinationDebugger({ visible = true }) {
    const [destinations, setDestinations] = useState<Array<{
        id: string;
        position: THREE.Vector3;
    }>>([]);

    // Update destinations on interval
    useEffect(() => {
        if (!visible) return;

        const interval = setInterval(() => {
            const active = getActiveDestinations();
            setDestinations(active.map(d => ({
                id: d.id,
                position: d.position
            })));
        }, 1000); // Update every second

        return () => clearInterval(interval);
    }, [visible]);

    if (!visible || destinations.length === 0) return null;

    return (
        <>
            {destinations.map((dest, index) => (
                <group key={`dest-${dest.id}-${index}`} position={dest.position}>
                    {/* Vertical pole */}
                    <mesh position={[0, 0.1, 0]}>
                        <boxGeometry args={[0.05, 1, 0.05]} />
                        <meshBasicMaterial color="red" transparent opacity={0.7} />
                    </mesh>

                    {/* Flag with employee ID */}
                    <mesh position={[0, 0.6, 0]} rotation={[0, Math.PI / 4, 0]}>
                        <boxGeometry args={[0.4, 0.2, 0.01]} />
                        <meshBasicMaterial color="white" transparent opacity={0.9} />
                    </mesh>

                    {/* Base circle */}
                    <mesh position={[0, -0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[0.5, 16]} />
                        <meshBasicMaterial
                            color="red"
                            transparent
                            opacity={0.3}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                </group>
            ))}
        </>
    );
} 