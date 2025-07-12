import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useSidebar } from '../ui/sidebar';
import { Chat } from '../chat/chat';
import { useChatStore } from '@/lib/store/chat-store';
import { ChatSidebar } from '../layout/chat-sidebar';
import { motion } from 'framer-motion';
import FileManager from '../file-manager/file-manager';
import type { Id } from '@/convex/_generated/dataModel';
import { Users, User, MessageSquare } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useChatParticipantData } from '@/hooks/use-chat-participant-data';

const SIDEBAR_WIDTH_REM = '16rem';

interface ChatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chatParticipant: {
    type: 'employee' | 'team';
    employeeId: Id<"employees">;
    teamId: Id<"teams">;
  } | null;
}

export default function ChatDialog({
  isOpen,
  onOpenChange,
  chatParticipant,
}: ChatDialogProps) {

  const { threadId, currentMode } = useChatStore();
  const { open: isSidebarOpen } = useSidebar();

  // Use our optimized hook that gets data from already-loaded office data
  const { employeeData, teamData, teamMembers, isLoading: isLoadingData } = useChatParticipantData(chatParticipant);

  if (!chatParticipant || !threadId) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <div>Loading...</div>
        </DialogContent>
      </Dialog>
    );
  }

  // We already have the IDs we need from the store
  const mainParticipantId = chatParticipant.employeeId;
  const teamId = chatParticipant.teamId;

  // Get display data
  const displayData = chatParticipant.type === 'employee'
    ? employeeData
    : chatParticipant.type === 'team'
      ? teamData
      : null;

  // Chat mode context
  const isTeamChat = chatParticipant.type === 'team';
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
      subtitle: (displayData as any)?.jobTitle || "Direct conversation",
      badge: "1:1 Meeting",
      badgeVariant: "outline" as const
    };

  // Always render the Dialog to maintain consistent structure
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
