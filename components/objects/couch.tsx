import { Box } from "@react-three/drei";

// Simple Couch Component
export default function Couch({ position, rotationY }: { position: [number, number, number], rotationY: number }) {
    const couchColor = "#4682B4"; // SteelBlue
    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            {/* Base */}
            <Box args={[2.5, 0.4, 1]} position={[0, 0.2, 0]} castShadow>
                <meshStandardMaterial color={couchColor} />
            </Box>
            {/* Back */}
            <Box args={[2.5, 0.6, 0.2]} position={[0, 0.4 + 0.3, -0.5 + 0.1]} castShadow>
                <meshStandardMaterial color={couchColor} />
            </Box>
            {/* Arms */}
            <Box args={[0.2, 0.3, 1]} position={[-1.25 + 0.1, 0.4 + 0.15, 0]} castShadow>
                <meshStandardMaterial color={couchColor} />
            </Box>
            <Box args={[0.2, 0.3, 1]} position={[1.25 - 0.1, 0.4 + 0.15, 0]} castShadow>
                <meshStandardMaterial color={couchColor} />
            </Box>
        </group>
    );
}