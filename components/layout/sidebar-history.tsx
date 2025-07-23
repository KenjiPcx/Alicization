import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    useSidebar,
} from '@/components/ui/sidebar';
import { ChatItem } from './sidebar-history-item';
import { LoaderIcon } from '@/components/icons';

import type { Chat, User } from '@/lib/types';
import { useChatStore } from '@/lib/store/chat-store';
import { usePaginatedQuery, useAction, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAppStore } from '@/lib/store/app-store';

type EnrichedChat = Chat & {
    thread: {
        _id: string;
        _creationTime: number;
        title?: string;
        summary?: string;
        status: "active" | "archived";
        userId?: string;
    } | null;
};

const PAGE_SIZE = 20;

// Group chats by date
const groupChatsByDate = (chats: EnrichedChat[]) => {
    const now = new Date();
    const groups: Record<string, EnrichedChat[]> = {
        Today: [],
        Yesterday: [],
        'Previous 7 days': [],
        'Previous 30 days': [],
        Older: [],
    };

    chats.forEach((chat) => {
        const chatDate = new Date(chat._creationTime);

        if (isToday(chatDate)) {
            groups.Today.push(chat);
        } else if (isYesterday(chatDate)) {
            groups.Yesterday.push(chat);
        } else if (chatDate > subWeeks(now, 1)) {
            groups['Previous 7 days'].push(chat);
        } else if (chatDate > subMonths(now, 1)) {
            groups['Previous 30 days'].push(chat);
        } else {
            groups.Older.push(chat);
        }
    });

    return groups;
};

export function SidebarHistory() {
    const { setOpenMobile } = useSidebar();
    const { threadId, setThreadId } = useChatStore();
    const { activeChatParticipant } = useAppStore();
    const user = useQuery(api.auth.currentUser);

    // Use the correct chat owner ID based on the chat type
    const chatOwnerId = activeChatParticipant?.type === 'team'
        ? activeChatParticipant.teamId
        : activeChatParticipant?.employeeId;

    const {
        results: paginatedChats,
        status,
        loadMore,
    } = usePaginatedQuery(
        api.chat.getChatHistory,
        chatOwnerId ? { chatOwnerId } : "skip",
        { initialNumItems: PAGE_SIZE }
    );

    const deleteThread = useAction(api.chat.deleteThread);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const allChats = paginatedChats ?? [];
    const hasReachedEnd = status === "Exhausted";
    const isLoading = status === "LoadingFirstPage";

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            await deleteThread({ threadId: deleteId });
            toast.success('Chat deleted successfully');

            if (deleteId === threadId) {
                setThreadId(null);
            }
        } catch (error) {
            toast.error('Failed to delete chat');
            console.error('Delete error:', error);
        } finally {
            setShowDeleteDialog(false);
            setDeleteId(null);
        }
    };

    if (!user) {
        return (
            <SidebarGroup>
                <SidebarGroupContent>
                    <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
                        Login to save and revisit previous chats!
                    </div>
                </SidebarGroupContent>
            </SidebarGroup>
        );
    }

    if (isLoading) {
        return (
            <SidebarGroup>
                <SidebarGroupContent>
                    <div className="flex flex-col space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="rounded-md h-8 bg-sidebar-accent/50 animate-pulse" />
                        ))}
                    </div>
                </SidebarGroupContent>
            </SidebarGroup>
        );
    }

    if (allChats.length === 0) {
        return (
            <SidebarGroup>
                <SidebarGroupContent>
                    <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
                        <div className="flex flex-col items-center text-center gap-2">
                            <div>No chat history</div>
                            <div className="text-xs">Start a conversation to see your history here</div>
                        </div>
                    </div>
                </SidebarGroupContent>
            </SidebarGroup>
        );
    }

    const groupedChats = groupChatsByDate(allChats);

    return (
        <>
            <SidebarGroup>
                <SidebarGroupContent>
                    <SidebarMenu>
                        {Object.entries(groupedChats).map(([dateGroup, chats]) => {
                            if (chats.length === 0) return null;

                            return (
                                <div key={dateGroup}>
                                    <div className="px-2 py-1 text-xs font-medium text-sidebar-foreground/70">
                                        {dateGroup}
                                    </div>
                                    {chats.map((chat) => (
                                        <motion.div
                                            key={chat._id}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{
                                                opacity: { duration: 0.05 },
                                                height: { duration: 0.05 },
                                            }}
                                        >
                                            <ChatItem
                                                chat={{
                                                    id: chat.threadId,
                                                    title: chat.thread?.title || `Chat ${chat.threadId.slice(0, 8)}`,
                                                    visibility: chat.visibility || 'private',
                                                }}
                                                isActive={chat.threadId === threadId}
                                                onDelete={(chatId: string) => {
                                                    setDeleteId(chatId);
                                                    setShowDeleteDialog(true);
                                                }}
                                                setOpenMobile={setOpenMobile}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>

            {!hasReachedEnd && (
                <SidebarGroup>
                    <SidebarGroupContent>
                        <button
                            onClick={() => loadMore(PAGE_SIZE)}
                            className="w-full text-sidebar-foreground/70 text-xs hover:text-sidebar-foreground transition-colors py-2"
                            disabled={status === "LoadingMore"}
                        >
                            {status === "LoadingMore" ? (
                                <div className="flex items-center justify-center gap-2">
                                    <LoaderIcon />
                                    Loading...
                                </div>
                            ) : (
                                'Load more'
                            )}
                        </button>
                    </SidebarGroupContent>
                </SidebarGroup>
            )}

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete chat</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this chat and remove it from your
                            sidebar.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
