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

// Main Office Simulation Component
export default function OfficeSimulation() {
    const {
        activeParticipant,
        setActiveParticipant,
        debugMode,
        toggleDebugMode,
    } = useOfficeStore();

    const {
        isChatModalOpen,
        setIsChatModalOpen,
        setUserMetadata
    } = useAppStore();

    const { threadId, setThreadId } = useChatStore();

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
            setActiveParticipant({ type: 'employee', data: employee });
            setThreadId(await getLatestThreadId(employee._id, "employee"));
            setIsChatModalOpen(true);
        },
        [setActiveParticipant, setIsChatModalOpen, getLatestThreadId, setThreadId],
    );

    const handleTeamClick = useCallback(
        async (team: TeamData) => {
            setActiveParticipant({ type: 'team', data: team });
            // Use team ID as chatOwnerId to distinguish from direct supervisor chats
            setThreadId(await getLatestThreadId(team._id, "team"));
            setIsChatModalOpen(true);
        },
        [setActiveParticipant, setIsChatModalOpen, getLatestThreadId, setThreadId],
    );

    const handleChatModalClose = useCallback((isOpen: boolean) => {
        setIsChatModalOpen(isOpen);
        if (!isOpen) {
            // Clear selections when modal closes
            setActiveParticipant(null);
        }
    }, [setIsChatModalOpen, setActiveParticipant]);

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
                chatWith={activeParticipant}
            />
        </div>
    );
}
