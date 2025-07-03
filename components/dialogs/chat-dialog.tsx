import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import type { EmployeeData, TeamData } from '@/lib/types';
import { useSidebar } from '../ui/sidebar';
import { Chat } from '../chat/chat';
import { useChatStore } from '@/lib/store/chat-store';
import { ChatSidebar } from '../layout/chat-sidebar';
import { motion } from 'framer-motion';
import FileManager from '../file-manager/file-manager';
import { usePaginatedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

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

  if (!chatWith) return null;

  const { threadId, currentMode, modelId, initialVisibilityType } = useChatStore();
  const { open: isSidebarOpen } = useSidebar();

  const messages = usePaginatedQuery(
    api.chat.getMessages,
    threadId ? { threadId } : "skip",
    { initialNumItems: 30 },
  );

  // If threadId is not set, we are still creating the thread
  if (!threadId) {
    return <div>Loading...</div>
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[85vw] max-w-[85vw] h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{`Chat with ${chatWith.type} ${chatWith.data.name}`}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex h-full max-h-[77.5dvh] overflow-hidden relative">
          <ChatSidebar />
          <motion.div
            className="flex-1 flex flex-col overflow-hidden relative"
            animate={{ marginLeft: isSidebarOpen ? SIDEBAR_WIDTH_REM : '0rem' }}
            transition={{ duration: 0.2, ease: 'linear' }}
          >
            {currentMode === 'Chat' ? (
              <Chat
                threadId={threadId}
                mainParticipantId={chatWith.data.id}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
