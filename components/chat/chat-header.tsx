'use client';

import { useWindowSize } from 'usehooks-ts';
import { ModelSelector } from '@/components/chat/model-selector';
import { SidebarToggle } from '@/components/layout/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '../icons';
import { useSidebar } from '../ui/sidebar';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { type VisibilityType, VisibilitySelector } from './visibility-selector';
import { useChatStore } from '@/lib/store/chat-store';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAppStore } from '@/lib/store/app-store';

function PureChatHeader({
  threadId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
}: {
  threadId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { open } = useSidebar();
  const { setThreadId, initialVisibilityType } = useChatStore();
  const { width: windowWidth } = useWindowSize();
  const { activeChatParticipant } = useAppStore();
  const createThread = useMutation(api.chat.createThread);

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 z-10">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={async () => {
                if (!activeChatParticipant) return;

                // Use the correct chat owner ID based on the chat type
                const chatOwnerId = activeChatParticipant.type === 'team'
                  ? activeChatParticipant.teamId
                  : activeChatParticipant.employeeId;

                const { threadId } = await createThread({
                  chatOwnerId,
                  chatType: activeChatParticipant.type,
                  visibility: initialVisibilityType,
                });
                setThreadId(threadId);
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
      )}

      {!isReadonly && (
        <ModelSelector
          selectedModelId={selectedModelId}
          className="order-1 md:order-2"
        />
      )}

      {!isReadonly && (
        <VisibilitySelector
          threadId={threadId}
          selectedVisibilityType={selectedVisibilityType}
          className="order-1 md:order-3"
        />
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId && prevProps.selectedVisibilityType === nextProps.selectedVisibilityType;
});
