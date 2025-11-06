import { Box } from "@react-three/drei";

import { COMPUTER_HEIGHT, DESK_DEPTH, DESK_HEIGHT, DESK_WIDTH } from "@/constants";
import type { JSX } from "react";
import * as THREE from 'three';

interface DeskCustomProps {
    deskId: string;
    position: [number, number, number];
    rotationY: number;
    isHovered: boolean;
}

const defaultTableColor = new THREE.Color("white");
const hoveredTableColor = new THREE.Color("#a7f3d0");

export default function Desk({ deskId, position, rotationY, isHovered, ...props }: DeskCustomProps & Omit<JSX.IntrinsicElements['group'], 'position' | 'rotation'>) {
    const tableColor = isHovered ? hoveredTableColor : defaultTableColor;

    return (
        <group position={position} rotation={[0, rotationY, 0]} {...props} name={`desk-${deskId}`}>
            {/* Tabletop */}
            <Box args={[DESK_WIDTH, 0.1, DESK_DEPTH]} position={[0, DESK_HEIGHT, 0]} castShadow>
                <meshStandardMaterial color={tableColor} />
            </Box>
            {/* Legs */}
            <Box args={[0.1, DESK_HEIGHT, 0.1]} position={[-DESK_WIDTH / 2 + 0.1, DESK_HEIGHT / 2, DESK_DEPTH / 2 - 0.1]} castShadow>
                <meshStandardMaterial color="darkgrey" />
            </Box>
            <Box args={[0.1, DESK_HEIGHT, 0.1]} position={[DESK_WIDTH / 2 - 0.1, DESK_HEIGHT / 2, DESK_DEPTH / 2 - 0.1]} castShadow>
                <meshStandardMaterial color="darkgrey" />
            </Box>
            <Box args={[0.1, DESK_HEIGHT, 0.1]} position={[-DESK_WIDTH / 2 + 0.1, DESK_HEIGHT / 2, -DESK_DEPTH / 2 + 0.1]} castShadow>
                <meshStandardMaterial color="darkgrey" />
            </Box>
            <Box args={[0.1, DESK_HEIGHT, 0.1]} position={[DESK_WIDTH / 2 - 0.1, DESK_HEIGHT / 2, -DESK_DEPTH / 2 + 0.1]} castShadow>
                <meshStandardMaterial color="darkgrey" />
            </Box>
            {/* Computer Monitor */}
            <Box args={[0.5, COMPUTER_HEIGHT, 0.05]} position={[0, DESK_HEIGHT + 0.1 + COMPUTER_HEIGHT / 2, -DESK_DEPTH / 2 + 0.2]} castShadow>
                <meshStandardMaterial color="black" />
            </Box>
            {/* Computer Base */}
            <Box args={[0.2, 0.05, 0.2]} position={[0, DESK_HEIGHT + 0.1 + 0.025, -DESK_DEPTH / 2 + 0.2]} castShadow>
                <meshStandardMaterial color="darkgrey" />
            </Box>
        </group>
    );
}