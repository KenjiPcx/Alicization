import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import type { EmployeeData, TeamData } from '@/lib/types';
import { useSidebar } from '../ui/sidebar';
import { Chat } from '../chat/chat';
import { useChatStore } from '@/lib/store/chat-store';
import { ChatSidebar } from '../layout/chat-sidebar';
import { motion } from 'framer-motion';
import FileManager from '../file-manager/file-manager';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

const SIDEBAR_WIDTH_REM = '16rem';

interface ChatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chatWith: {
    type: "employee",
    data: EmployeeData;
  } | {
    type: "team",
    data: TeamData;
  } | null;
}

export default function ChatDialog({
  isOpen,
  onOpenChange,
  chatWith,
}: ChatDialogProps) {

  const { threadId, currentMode } = useChatStore();
  const { open: isSidebarOpen } = useSidebar();

  // Get team supervisor if this is a team chat
  const teamSupervisor = useQuery(
    api.teams.getTeamSupervisor,
    chatWith?.type === 'team' && chatWith.data._id
      ? { teamId: chatWith.data._id as Id<"teams"> }
      : 'skip'
  );

  // Determine the main participant ID and team ID
  const mainParticipantId = chatWith?.type === 'team'
    ? teamSupervisor?._id
    : chatWith?.data._id as Id<"employees"> | undefined;

  const teamId = chatWith?.type === 'team'
    ? chatWith.data._id as Id<"teams">
    : chatWith?.type === 'employee'
      ? chatWith.data.teamId as Id<"teams"> | undefined
      : undefined;

  // Always render the Dialog to maintain consistent structure
  return (
    <Dialog open={isOpen && !!chatWith} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[85vw] max-w-[85vw] h-[85vh] flex flex-col p-0">
        {chatWith && (
          <>
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>{`Chat with ${chatWith.data.name} ${chatWith.type === "employee" ? `(${chatWith.data.jobTitle})` : "Team"}`}</DialogTitle>
            </DialogHeader>

            <div className="flex-1 flex h-full max-h-[77.5dvh] overflow-hidden relative">
              {!threadId ? (
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
