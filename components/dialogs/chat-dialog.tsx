import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useSidebar } from '../ui/sidebar';
import { Chat } from '../chat/chat';
import { useChatStore } from '@/lib/store/chat-store';
import { ChatSidebar } from '../layout/chat-sidebar';
import { motion } from 'framer-motion';
import { Users, User } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useChatParticipantData } from '@/hooks/use-chat-participant-data';
import { EmployeeData } from '@/lib/types';
import { useAppStore } from '@/lib/store/app-store';
import { useMicroAppStore } from '@/lib/store/micro-app-store';
import { useCallback } from 'react';

const SIDEBAR_WIDTH_REM = '16rem';

export default function ChatDialog() {
  const { threadId, currentMode } = useChatStore();
  const { open: isSidebarOpen } = useSidebar();

  const {
    activeChatParticipant,
    setActiveChatParticipant,
    isChatModalOpen,
    setIsChatModalOpen,
  } = useAppStore();
  const { setCurrentMicroApp } = useMicroAppStore();

  // Use our optimized hook that gets data from already-loaded office data
  const { employeeData, teamData, teamMembers, isLoading: isLoadingData } = useChatParticipantData(activeChatParticipant);

  // Handle chat modal close
  const handleChatModalClose = useCallback((isOpen: boolean) => {
    setIsChatModalOpen(isOpen);
    if (!isOpen) {
      // Clear selections when modal closes
      setActiveChatParticipant(null);
      setCurrentMicroApp(null);
    }
  }, [setIsChatModalOpen, setActiveChatParticipant, setCurrentMicroApp]);

  if (!activeChatParticipant || !threadId) {
    return (
      <Dialog open={isChatModalOpen} onOpenChange={handleChatModalClose}>
        <DialogContent>
          <div>Loading...</div>
        </DialogContent>
      </Dialog>
    );
  }

  // We already have the IDs we need from the store
  const mainParticipantId = activeChatParticipant.employeeId;
  const teamId = activeChatParticipant.teamId;

  // Get display data
  const displayData = activeChatParticipant.type === 'employee'
    ? employeeData
    : activeChatParticipant.type === 'team'
      ? teamData
      : null;

  // Chat mode context
  const isTeamChat = activeChatParticipant.type === 'team';
  const chatModeInfo = isTeamChat
    ? {
      icon: <Users className="h-4 w-4" />,
      title: `Team Meeting with ${displayData?.name}`,
      subtitle: `Collaborative chat with ${teamMembers?.length || 0} team members`,
      badge: "Team Collaboration",
      badgeVariant: "secondary" as const
    }
    : {
      icon: <User className="h-4 w-4" />,
      title: `Chat with ${displayData?.name}`,
      subtitle: (displayData as EmployeeData)?.jobTitle || "Direct conversation",
      badge: "1:1 Meeting",
      badgeVariant: "outline" as const
    };

  // Always render the Dialog to maintain consistent structure
  return (
    <Dialog open={isChatModalOpen} onOpenChange={handleChatModalClose}>
      <DialogContent className="min-w-[85vw] max-w-[85vw] h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-3">
            {chatModeInfo.icon}
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 flex-nowrap">
                {isLoadingData ? (
                  'Loading...'
                ) : displayData ? (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {chatModeInfo.subtitle}
                    </span>
                    <span className="truncate">{chatModeInfo.title}</span>
                    <Badge variant={chatModeInfo.badgeVariant} className="flex-shrink-0">
                      {chatModeInfo.badge}
                    </Badge>
                  </>
                ) : (
                  'Chat'
                )}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex h-full max-h-[77.5dvh] overflow-hidden relative">
          {!threadId || isLoadingData ? (
            <div className="flex-1 flex items-center justify-center">
              <div>Loading...</div>
            </div>
          ) : (
            <>
              <ChatSidebar />
              <motion.div
                className="flex-1 flex flex-col overflow-hidden relative"
                animate={{ marginLeft: isSidebarOpen ? SIDEBAR_WIDTH_REM : '0rem' }}
                transition={{ duration: 0.2, ease: 'linear' }}
              >
                {currentMode === 'Chat' && mainParticipantId ? (
                  <Chat
                    threadId={threadId}
                    mainParticipantId={mainParticipantId}
                    teamId={teamId}
                    isReadonly={false}
                    // Pass chat mode for different styling/behavior
                    chatMode={isTeamChat ? 'team' : 'direct'}
                  />
                ) : currentMode === 'Files' ? (
                  <div>Files</div>
                  // <FileManager />
                ) : (
                  <div>
                    <h1>Config</h1>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
