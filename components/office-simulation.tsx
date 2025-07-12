import { useCallback, useEffect } from 'react';
import type { EmployeeData, TeamData } from '@/lib/types';
import OfficeScene from './office-scene';
import ChatDialog from './dialogs/chat-dialog';
import SettingsDialog from './dialogs/settings-dialog';
import { useOfficeStore } from '@/lib/store/office-store';
import { useAppStore } from '@/lib/store/app-store';
import { useChatStore } from '@/lib/store/chat-store';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useOfficeData } from '@/hooks/use-office-data';
import type { Id } from '@/convex/_generated/dataModel';

// Main Office Simulation Component
export default function OfficeSimulation() {
    const {
        activeChatParticipant,
        setActiveChatParticipant,
        debugMode,
        toggleDebugMode,
    } = useOfficeStore();

    const {
        isChatModalOpen,
        setIsChatModalOpen,
        setUserMetadata
    } = useAppStore();

    useEffect(() => {
        console.log("isChatModalOpen", isChatModalOpen);
    }, [isChatModalOpen]);

    const { setThreadId } = useChatStore();

    // Thread management
    const createThread = useMutation(api.chat.createThread);
    const getLatestThreadByChatOwnerId = useAction(api.chat.getLatestThreadByChatOwnerId);
    const getLatestThreadId = useCallback(async (chatOwnerId: string, chatType: "employee" | "team" = "employee") => {
        const latestThread = await getLatestThreadByChatOwnerId({ chatOwnerId });
        if (latestThread?.threadId) {
            return latestThread.threadId;
        }

        // Create a new thread if it doesn't exist
        const { threadId: newThreadId } = await createThread({
            chatType,
            chatOwnerId,
        });

        return newThreadId;
    }, [getLatestThreadByChatOwnerId, createThread]);

    // Fetch user metadata
    const userMetadata = useQuery(api.usage.getCurrentUserMetadata);
    useEffect(() => {
        if (userMetadata) {
            setUserMetadata({ userType: userMetadata.type });
        }
    }, [userMetadata, setUserMetadata]);

    const handleEmployeeClick = useCallback(
        async (employee: EmployeeData) => {
            setActiveChatParticipant({
                type: 'employee',
                employeeId: employee._id as Id<"employees">,
                teamId: employee.teamId as Id<"teams">
            });
            setThreadId(await getLatestThreadId(employee._id, "employee"));
            setIsChatModalOpen(true);
        },
        [setActiveChatParticipant, setIsChatModalOpen, getLatestThreadId, setThreadId],
    );

    const handleTeamClick = useCallback(
        async (team: TeamData) => {
            // Use supervisor as the employee ID for team chats
            if (!team.supervisorId) {
                console.error('Team has no supervisor:', team);
                return;
            }

            setActiveChatParticipant({
                type: 'team',
                employeeId: team.supervisorId as Id<"employees">,
                teamId: team._id as Id<"teams">
            });
            // Use team ID as chatOwnerId to distinguish from direct supervisor chats
            setThreadId(await getLatestThreadId(team._id, "team"));
            setIsChatModalOpen(true);
        },
        [setActiveChatParticipant, setIsChatModalOpen, getLatestThreadId, setThreadId],
    );

    const handleChatModalClose = useCallback((isOpen: boolean) => {
        setIsChatModalOpen(isOpen);
        if (!isOpen) {
            // Clear selections when modal closes
            setActiveChatParticipant(null);
        }
    }, [setIsChatModalOpen, setActiveChatParticipant]);

    // Fetch office data from database
    const { teams, employees, desks, isLoading } = useOfficeData();

    // TODO: Handle realtime events, office scene should handle notifications

    if (isLoading) {
        return (
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div>Loading office data...</div>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <OfficeScene
                handleEmployeeClick={handleEmployeeClick}
                handleTeamClick={handleTeamClick}
                debugMode={debugMode}
                teams={teams}
                employees={employees}
                desks={desks}
            />

            <SettingsDialog
                debugMode={debugMode}
                toggleDebugMode={toggleDebugMode}
            />

            <ChatDialog
                isOpen={isChatModalOpen}
                onOpenChange={handleChatModalClose}
                chatParticipant={activeChatParticipant}
            />
        </div>
    );
}
