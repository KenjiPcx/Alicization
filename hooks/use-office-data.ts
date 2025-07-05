import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { EmployeeData, TeamData, DeskLayoutData } from '@/lib/types';
import { useMemo } from 'react';
import { getDeskPosition, getDeskRotation, getEmployeePositionAtDesk } from '@/lib/office/layout-utils';

export function useOfficeData() {
    // Fetch all data from backend
    const teams = useQuery(api.teams.getAllTeams);
    const employees = useQuery(api.employees.getAllEmployees);

    // Transform data to match frontend types
    const transformedData = useMemo(() => {
        if (!teams || !employees) {
            return { teams: [], employees: [], desks: [], isLoading: true };
        }

        // Create team data with employees and supervisor
        const teamData: TeamData[] = teams.map(team => {
            const teamEmployees = employees.filter(emp => emp.teamId === team._id);
            const supervisor = teamEmployees.find(emp => emp.isSupervisor);

            return {
                ...team,
                employees: teamEmployees.map(emp => emp._id),
                supervisorId: supervisor?._id,
            };
        });

        // Create employee data with positions calculated from desk indices
        const employeeData: EmployeeData[] = employees.map(employee => {
            const team = teams.find(t => t._id === employee.teamId);

            // Calculate position based on desk index and team cluster position
            let position: [number, number, number];
            if (employee.deskIndex !== undefined && team?.clusterPosition) {
                const deskPosition = getDeskPosition(
                    team.clusterPosition,
                    employee.deskIndex,
                    team.deskCount || 1
                );
                const deskRotation = getDeskRotation(employee.deskIndex, team.deskCount || 1);
                // Calculate employee position with offset from desk
                position = getEmployeePositionAtDesk(deskPosition, deskRotation);
            } else {
                // Random position if no desk assigned (walking around)
                const FLOOR_SIZE = 35;
                const HALF_FLOOR = FLOOR_SIZE / 2;
                let x: number;
                let z: number;
                do {
                    x = Math.random() * FLOOR_SIZE - HALF_FLOOR;
                    z = Math.random() * FLOOR_SIZE - HALF_FLOOR;
                } while (Math.abs(x) > HALF_FLOOR || Math.abs(z) > HALF_FLOOR);
                position = [x, 0.4, z]; // 0.4 is CYLINDER_HEIGHT / 2
            }

            return {
                ...employee,
                id: employee._id, // For backward compatibility
                initialPosition: position,
                isBusy: employee.deskIndex !== undefined,
                deskId: employee.deskIndex !== undefined ? `${team?._id}-desk-${employee.deskIndex}` : undefined,
                team: team?.name || 'Unknown',
            };
        });

        // Generate desk layout data for visualization
        const deskData: DeskLayoutData[] = [];
        teams.forEach(team => {
            if (team.clusterPosition && team.deskCount) {
                for (let i = 0; i < team.deskCount; i++) {
                    const position = getDeskPosition(team.clusterPosition, i, team.deskCount);
                    const rotation = getDeskRotation(i, team.deskCount);

                    deskData.push({
                        id: `${team._id}-desk-${i}`,
                        position,
                        rotationY: rotation,
                        team: team.name,
                    });
                }
            }
        });

        return {
            teams: teamData,
            employees: employeeData,
            desks: deskData,
            isLoading: false,
        };
    }, [teams, employees]);

    return transformedData;
} 