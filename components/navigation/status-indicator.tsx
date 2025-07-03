import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from 'three';
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Group } from "three";

export type StatusType = 'info' | 'success' | 'question' | 'warning' | 'none';

interface StatusIndicatorProps {
    status: StatusType;
    message?: string;
    visible: boolean;
}

// Simple iconic status indicators made from basic shapes
const StatusIcons = {
    // Info icon: vertical bar with dot on top
    info: ({ color }: { color: string }) => (
        <group>
            {/* Vertical bar */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.125, 8]} />
                <meshStandardMaterial color={color} roughness={0.2} />
            </mesh>

            {/* Dot on top */}
            <mesh position={[0, 0.1, 0]}>
                <sphereGeometry args={[0.03, 12, 12]} />
                <meshStandardMaterial color={color} roughness={0.2} />
            </mesh>
        </group>
    ),

    // Success icon (checkmark)
    success: ({ color }: { color: string }) => (
        <group rotation={[Math.PI, 0, 0]}>
            {/* Shorter arm (the upward left part) */}
            <mesh position={[-0.05, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[0.075, 0.04, 0.04]} />
                <meshStandardMaterial color={color} roughness={0.2} />
            </mesh>

            {/* Longer arm (the downward right part) */}
            <mesh position={[0.05, -0.02, 0]} rotation={[0, 0, -Math.PI / 4]}>
                <boxGeometry args={[0.21, 0.04, 0.04]} />
                <meshStandardMaterial color={color} roughness={0.2} />
            </mesh>
        </group>
    ),

    // Question mark: half circle + bar + dot
    question: ({ color }: { color: string }) => (
        <group>
            {/* Half circle at top */}
            <mesh position={[0, 0.075, 0]}>
                <torusGeometry args={[0.05, 0.025, 8, 16, 1.6 * Math.PI]} />
                <meshStandardMaterial color={color} roughness={0.2} />
            </mesh>

            {/* Short vertical bar */}
            <mesh position={[0.0, 0, 0]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.08, 8]} />
                <meshStandardMaterial color={color} roughness={0.2} />
            </mesh>

            {/* Dot at bottom */}
            <mesh position={[0, -0.08, 0]}>
                <sphereGeometry args={[0.03, 12, 12]} />
                <meshStandardMaterial color={color} roughness={0.2} />
            </mesh>
        </group>
    ),

    // Warning/exclamation: vertical bar with dot at bottom
    warning: ({ color }: { color: string }) => (
        <group>
            {/* Vertical bar */}
            <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.025, 0.025, 0.15, 8]} />
                <meshStandardMaterial color={color} roughness={0.2} />
            </mesh>

            {/* Dot at bottom */}
            <mesh position={[0, -0.08, 0]}>
                <sphereGeometry args={[0.03, 12, 12]} />
                <meshStandardMaterial color={color} roughness={0.2} />
            </mesh>
        </group>
    ),

    // Fallback/none (shouldn't be visible)
    none: ({ color }: { color: string }) => null
};

// Get color for status type
const getStatusColor = (status: StatusType): string => {
    switch (status) {
        case 'info':
            return '#3498db';  // Blue
        case 'success':
            return '#2ecc71';  // Green
        case 'question':
            return '#f1c40f';  // Yellow
        case 'warning':
            return '#e74c3c';  // Red
        default:
            return '#FFFFFF';  // White fallback
    }
};

export default function StatusIndicator({ status, message, visible }: StatusIndicatorProps) {
    // Skip rendering if not visible
    if (!visible) return null;

    // Reference to the indicator group for animations
    const groupRef = useRef<Group>(null);

    // State to track whether to show the message or just the icon
    const [showMessage, setShowMessage] = useState(!!message);

    // Function to toggle message visibility when icon is clicked
    const handleIconClick = () => {
        if (message) {
            setShowMessage(true);
            // Reset the auto-hide timer when clicked
            resetMessageTimer();
        }
    };

    // Set up timer to auto-hide messages after 60 seconds
    const messageTimerRef = useRef<NodeJS.Timeout | null>(null);

    const resetMessageTimer = () => {
        // Clear any existing timer
        if (messageTimerRef.current) {
            clearTimeout(messageTimerRef.current);
        }

        // Set new timer to hide message after 60 seconds
        messageTimerRef.current = setTimeout(() => {
            setShowMessage(false);
        }, 60000); // 60 seconds
    };

    // Initialize timer when component mounts with a message
    useEffect(() => {
        if (message) {
            resetMessageTimer();
        }

        // Cleanup timer on unmount
        return () => {
            if (messageTimerRef.current) {
                clearTimeout(messageTimerRef.current);
            }
        };
    }, [message]);

    // Update showMessage when message prop changes
    useEffect(() => {
        setShowMessage(!!message);
        if (message) {
            resetMessageTimer();
        }
    }, [message]);

    // Time offset to make different indicators bob at different times
    const timeOffset = useMemo(() => Math.random() * Math.PI * 2, []);

    // Get color based on status
    const statusColor = useMemo(() => getStatusColor(status), [status]);

    // Whether to pulse (for warning/question)
    const shouldPulse = useMemo(() =>
        status === 'warning' || status === 'question',
        [status]);

    // Position higher above the employee's head
    const basePosition: [number, number, number] = [0, 0.65, 0];

    // Get the appropriate icon component
    const IconComponent = StatusIcons[status];

    // Add floating animation
    useFrame((state) => {
        if (groupRef.current) {
            // Enhanced floating movement
            const timeElapsed = state.clock.elapsedTime;

            // Vertical bob
            const bobHeight = 0.05;
            const bobSpeed = 1.0;
            groupRef.current.position.y = basePosition[1] + Math.sin((timeElapsed * bobSpeed) + timeOffset) * bobHeight;

            // Gentle rotation - only if not showing message bubble
            if (!showMessage) {
                groupRef.current.rotation.y = timeElapsed * 0.5;
            }

            // Pulsing effect for warning/question
            if (shouldPulse && !showMessage) {
                const pulse = 1.0 + Math.sin((timeElapsed * 2) + timeOffset) * 0.1;
                groupRef.current.scale.set(pulse, pulse, pulse);
            }
        }
    });

    return (
        <group
            ref={groupRef}
            position={basePosition}
            onClick={handleIconClick}
        >
            {showMessage && message ? (
                <>
                    {/* Message bubble with icon */}
                    <Html
                        position={[0, 0.15, 0]}
                        center
                        distanceFactor={8}
                        zIndexRange={[1, 0]}
                    >
                        <div style={{
                            background: statusColor,
                            padding: '8px 12px',
                            borderRadius: '12px',
                            maxWidth: '350px',
                            minWidth:"125px",
                            fontSize: '11px',
                            color: 'white',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <div style={{
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '50%',
                                flexShrink: 0
                            }}>
                                {status === 'info' && 'i'}
                                {status === 'success' && '✓'}
                                {status === 'question' && '?'}
                                {status === 'warning' && '!'}
                            </div>
                            <div style={{
                                whiteSpace: 'normal',
                                wordBreak: 'normal',
                                textAlign: 'center'
                            }}>
                                {message}
                            </div>
                        </div>
                    </Html>
                </>
            ) : (
                <>
                    {/* Clickable icon */}
                    <group onClick={message ? handleIconClick : undefined}>
                        <IconComponent color={statusColor} />
                    </group>
                </>
            )}
        </group>
    );
} 