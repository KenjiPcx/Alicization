import { useMemo } from 'react';
import { useOfficeData } from './use-office-data';
import type { Id } from '@/convex/_generated/dataModel';

interface ChatParticipant {
    type: 'employee' | 'team';
    employeeId: Id<"employees">;
    teamId: Id<"teams">;
}

export function useChatParticipantData(chatParticipant: ChatParticipant | null) {
    const { employees, teams, isLoading } = useOfficeData();

    const participantData = useMemo(() => {
        if (!chatParticipant || isLoading) {
            return {
                employeeData: null,
                teamData: null,
                teamMembers: [],
                isLoading,
            };
        }

        // Find the employee (either the main employee or supervisor for team chats)
        const employeeData = employees.find(emp => emp._id === chatParticipant.employeeId);

        // Find the team
        const teamData = teams.find(team => team._id === chatParticipant.teamId);

        // Get team members for team chats
        const teamMembers = chatParticipant.type === 'team'
            ? employees.filter(emp => emp.teamId === chatParticipant.teamId)
            : [];

        return {
            employeeData,
            teamData,
            teamMembers,
            isLoading: false,
        };
    }, [chatParticipant, employees, teams, isLoading]);

    return participantData;
} 