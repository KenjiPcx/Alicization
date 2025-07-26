import { DraggableObjectWrapper } from './draggable-object';
import type { Id } from '@/convex/_generated/dataModel';

interface GlassWallProps {
    objectId: Id<"officeObjects">;
    position?: [number, number, number];
    rotation?: [number, number, number];
    companyId?: Id<"companies">;
    dimensions?: [number, number, number]; // [width, height, depth]
}

// Glass Wall Component
export default function GlassWall({
    objectId,
    position,
    rotation,
    companyId,
    dimensions = [4, 3, 0.25], // Default dimensions: 4 units wide, 3 units tall, 0.2 units thick
}: GlassWallProps) {
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
                <mesh castShadow receiveShadow>
                    <boxGeometry args={dimensions} />
                    <meshStandardMaterial
                        color="lightblue"
                        opacity={0.3}
                        transparent
                        depthWrite={false}
                    />
                </mesh>
            </group>
        </DraggableObjectWrapper>
    );
}