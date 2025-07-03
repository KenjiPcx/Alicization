import { useCallback, useEffect, useMemo } from 'react';
import type { EmployeeData, TeamData } from '@/lib/types';
import OfficeScene from './office-scene';
import ChatDialog from './dialogs/chat-dialog';
import SettingsDialog from './dialogs/settings-dialog';
import { useOfficeStore } from '@/lib/store/office-store';
import { useAppStore } from '@/lib/store/app-store';
import { useChatStore } from '@/lib/store/chat-store';
import { useAction, usePaginatedQuery, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

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
    const getLatestThreadId = useCallback(async (chatOwnerId: string) => {
        const latestThread = await getLatestThreadByChatOwnerId({ chatOwnerId });
        if (latestThread?.threadId) {
            return latestThread.threadId;
        }

        // Create a new thread if it doesn't exist
        const { threadId: newThreadId } = await createThread({ chatType: "employee" });

        return newThreadId;
    }, [getLatestThreadByChatOwnerId, setThreadId, createThread]);

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
            setThreadId(await getLatestThreadId(employee.id));
            setIsChatModalOpen(true);
        },
        [setActiveParticipant, setIsChatModalOpen, getLatestThreadId],
    );

    const handleTeamClick = useCallback(
        async (team: TeamData) => {
            setActiveParticipant({ type: 'team', data: team });
            setThreadId(await getLatestThreadId(team.id));
            setIsChatModalOpen(true);
        },
        [setActiveParticipant, setIsChatModalOpen, getLatestThreadId],
    );

    const handleChatModalClose = useCallback((isOpen: boolean) => {
        setIsChatModalOpen(isOpen);
        if (!isOpen) {
            // Clear selections when modal closes
            setActiveParticipant(null);
        }
    }, [setIsChatModalOpen, setActiveParticipant]);

    // TODO: Handle realtime events, office scene should handle notifications

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <OfficeScene
                handleEmployeeClick={handleEmployeeClick}
                handleTeamClick={handleTeamClick}
                debugMode={debugMode}
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
