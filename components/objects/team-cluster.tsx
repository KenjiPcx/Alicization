import { useState } from 'react';
import Desk from './desk';
import type { DeskLayoutData, TeamData } from '@/lib/types';

interface TeamClusterProps {
    team: TeamData;
    desks: ReadonlyArray<DeskLayoutData>;
    handleTeamClick: (team: TeamData) => void;
}

export default function TeamCluster({ team, desks, handleTeamClick }: TeamClusterProps) {
    // State for hover is localized here
    const [isHovered, setIsHovered] = useState(false);

    return (
        <group
            // Key is applied where this component is used (.map in OfficeScene)
            onClick={(e) => { e.stopPropagation(); handleTeamClick(team); }}
            onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); }}
            onPointerOut={(e) => { e.stopPropagation(); setIsHovered(false); }}
        >
            {desks.map((desk) => (
                <Desk
                    key={desk.id}
                    deskId={desk.id}
                    position={desk.position}
                    rotationY={desk.rotationY}
                    isHovered={isHovered} // Pass down the local hover state
                />
            ))}
        </group>
    );
} 