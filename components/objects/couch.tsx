import { Box } from "@react-three/drei";
import { DraggableObjectWrapper } from './draggable-object';
import type { Id } from '@/convex/_generated/dataModel';

interface CouchProps {
    objectId: Id<"officeObjects">;
    position?: [number, number, number];
    rotation?: [number, number, number];
    companyId?: Id<"companies">;
}

// Simple Couch Component
export default function Couch({
    objectId,
    position,
    rotation,
    companyId,
}: CouchProps) {
    const couchColor = "#4682B4"; // SteelBlue

    return (
        <DraggableObjectWrapper
            objectType="furniture"
            objectId={objectId}
            showHoverEffect={true}
            companyId={companyId}
            initialPosition={position}
            initialRotation={rotation}
        >
            <group rotation={rotation}>
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
        </DraggableObjectWrapper>
    );
}