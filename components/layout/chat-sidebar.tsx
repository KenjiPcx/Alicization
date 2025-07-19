import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/layout/sidebar-history';
// import { SidebarUserNav } from '@/components/layout/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar, // This is the component we are applying classes to
  SidebarContent,
  // SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarProvider,
  useSidebar, // Provides the 'open' state
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { cn, generateUUID } from '@/lib/utils'; // Assuming this path is correct for cn
import { useChatStore } from '@/lib/store/chat-store';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { useOfficeStore } from '@/lib/store/office-store';
import { useOnboarding } from '@/hooks/use-onboarding';

export function ChatSidebar() {
  const { setOpenMobile, open } = useSidebar();
  const { setThreadId, currentMode, setCurrentMode, initialVisibilityType } = useChatStore();
  const { activeChatParticipant } = useOfficeStore();
  const { resetOnboarding } = useOnboarding();
  const createThread = useMutation(api.chat.createThread);

  return (
    <Sidebar
      className={cn(
        'absolute top-0 left-0 h-full', // Removed pt-16
        'w-64', // Fixed width (16rem)
        'transition-all duration-200 ease-linear', // Combined transition for transform and opacity
        open ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0', // Animation states
        'overflow-hidden', // Ensures its own content clips if needed
      )}
    >
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <div className="flex flex-row gap-2 items-center px-2 text-lg font-semibold hover:bg-muted rounded-md cursor-pointer">
              {currentMode}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit"
                  onClick={async () => {
                    setOpenMobile(false);
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
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">New Chat</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory />
      </SidebarContent>
      {/* <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter> */}
    </Sidebar>
  );
}
