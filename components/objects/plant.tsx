import { Cylinder, Sphere } from "@react-three/drei";
import { DraggableObjectWrapper } from './draggable-object';
import type { Id } from '@/convex/_generated/dataModel';

interface PlantProps {
    objectId: Id<"officeObjects">;
    position?: [number, number, number];
    rotation?: [number, number, number];
    companyId?: Id<"companies">;
}

// Simple Plant Component
export default function Plant({
    objectId,
    position,
    rotation,
    companyId,
}: PlantProps) {
    return (
        <DraggableObjectWrapper
            objectType="furniture"
            objectId={objectId}
            showHoverEffect={true}
            companyId={companyId}
            initialPosition={position}
            initialRotation={rotation}
        >
            <group>
                {/* Pot */}
                <Cylinder args={[0.3, 0.35, 0.5, 16]} position={[0, 0.25, 0]} castShadow>
                    <meshStandardMaterial color="#8B4513" /> {/* SaddleBrown */}
                </Cylinder>
                {/* Foliage */}
                <Sphere args={[0.5, 16, 16]} position={[0, 0.5 + 0.3, 0]} castShadow>
                    <meshStandardMaterial color="#228B22" /> {/* ForestGreen */}
                </Sphere>
            </group>
        </DraggableObjectWrapper>
    );
}