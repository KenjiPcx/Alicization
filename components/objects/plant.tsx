import { Cylinder, Sphere } from "@react-three/drei";

// Simple Plant Component
export default function Plant({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            {/* Pot */}
            <Cylinder args={[0.3, 0.35, 0.5, 16]} position={[0, 0.25, 0]}>
                <meshStandardMaterial color="#8B4513" /> {/* SaddleBrown */}
            </Cylinder>
            {/* Foliage */}
            <Sphere args={[0.5, 16, 16]} position={[0, 0.5 + 0.3, 0]}>
                <meshStandardMaterial color="#228B22" /> {/* ForestGreen */}
            </Sphere>
        </group>
    );
}