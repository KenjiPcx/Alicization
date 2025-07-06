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
import { usePaginatedQuery, useMutation, useAction, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useOfficeStore } from '@/lib/store/office-store';

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

type GroupedChats = {
    today: EnrichedChat[];
    yesterday: EnrichedChat[];
    lastWeek: EnrichedChat[];
    lastMonth: EnrichedChat[];
    older: EnrichedChat[];
};

const PAGE_SIZE = 20;

const groupChatsByDate = (chats: EnrichedChat[]): GroupedChats => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);

    return chats.reduce(
        (groups, chat) => {
            const chatDate = new Date(chat._creationTime);

            if (isToday(chatDate)) {
                groups.today.push(chat);
            } else if (isYesterday(chatDate)) {
                groups.yesterday.push(chat);
            } else if (chatDate > oneWeekAgo) {
                groups.lastWeek.push(chat);
            } else if (chatDate > oneMonthAgo) {
                groups.lastMonth.push(chat);
            } else {
                groups.older.push(chat);
            }

            return groups;
        },
        {
            today: [],
            yesterday: [],
            lastWeek: [],
            lastMonth: [],
            older: [],
        } as GroupedChats,
    );
};

export function SidebarHistory() {
    const { setOpenMobile } = useSidebar();
    const { threadId, setThreadId } = useChatStore();
    const { activeParticipant } = useOfficeStore();
    const user = useQuery(api.auth.currentUser);

    console.log("Rerendering SidebarHistory", activeParticipant);
    const {
        results: paginatedChats,
        status,
        loadMore,
    } = usePaginatedQuery(
        api.chat.getChatHistory,
        activeParticipant?.data._id ? { chatOwnerId: activeParticipant?.data._id } : "skip",
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
                <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                    Today
                </div>
                <SidebarGroupContent>
                    <div className="flex flex-col">
                        {[44, 32, 28, 64, 52].map((item) => (
                            <div
                                key={item}
                                className="rounded-md h-8 flex gap-2 px-2 items-center"
                            >
                                <div
                                    className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                                    style={
                                        {
                                            '--skeleton-width': `${item}%`,
                                        } as React.CSSProperties
                                    }
                                />
                            </div>
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
                        Your conversations will appear here once you start chatting!
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
                        <div className="flex flex-col gap-6">
                            {groupedChats.today.length > 0 && (
                                <div>
                                    <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                                        Today
                                    </div>
                                    {groupedChats.today.map((chat) => (
                                        <ChatItem
                                            key={chat._id}
                                            chat={{
                                                ...chat,
                                                id: chat.threadId,
                                                title: chat.thread?.title || 'New Chat',
                                                visibility: chat.visibility || 'private',
                                            }}
                                            isActive={chat.threadId === threadId}
                                            onDelete={(chatId) => {
                                                setDeleteId(chatId);
                                                setShowDeleteDialog(true);
                                            }}
                                            setOpenMobile={setOpenMobile}
                                        />
                                    ))}
                                </div>
                            )}

                            {groupedChats.yesterday.length > 0 && (
                                <div>
                                    <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                                        Yesterday
                                    </div>
                                    {groupedChats.yesterday.map((chat) => (
                                        <ChatItem
                                            key={chat._id}
                                            chat={{
                                                ...chat,
                                                id: chat.threadId,
                                                title: chat.thread?.title || 'New Chat',
                                                visibility: chat.visibility || 'private',
                                            }}
                                            isActive={chat.threadId === threadId}
                                            onDelete={(chatId) => {
                                                setDeleteId(chatId);
                                                setShowDeleteDialog(true);
                                            }}
                                            setOpenMobile={setOpenMobile}
                                        />
                                    ))}
                                </div>
                            )}

                            {groupedChats.lastWeek.length > 0 && (
                                <div>
                                    <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                                        Last 7 days
                                    </div>
                                    {groupedChats.lastWeek.map((chat) => (
                                        <ChatItem
                                            key={chat._id}
                                            chat={{
                                                ...chat,
                                                id: chat.threadId,
                                                title: chat.thread?.title || 'New Chat',
                                                visibility: chat.visibility || 'private',
                                            }}
                                            isActive={chat.threadId === threadId}
                                            onDelete={(chatId) => {
                                                setDeleteId(chatId);
                                                setShowDeleteDialog(true);
                                            }}
                                            setOpenMobile={setOpenMobile}
                                        />
                                    ))}
                                </div>
                            )}

                            {groupedChats.lastMonth.length > 0 && (
                                <div>
                                    <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                                        Last 30 days
                                    </div>
                                    {groupedChats.lastMonth.map((chat) => (
                                        <ChatItem
                                            key={chat._id}
                                            chat={{
                                                ...chat,
                                                id: chat.threadId,
                                                title: chat.thread?.title || 'New Chat',
                                                visibility: chat.visibility || 'private',
                                            }}
                                            isActive={chat.threadId === threadId}
                                            onDelete={(chatId) => {
                                                setDeleteId(chatId);
                                                setShowDeleteDialog(true);
                                            }}
                                            setOpenMobile={setOpenMobile}
                                        />
                                    ))}
                                </div>
                            )}

                            {groupedChats.older.length > 0 && (
                                <div>
                                    <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                                        Older than last month
                                    </div>
                                    {groupedChats.older.map((chat) => (
                                        <ChatItem
                                            key={chat._id}
                                            chat={{
                                                ...chat,
                                                id: chat.threadId,
                                                title: chat.thread?.title || 'New Chat',
                                                visibility: chat.visibility || 'private',
                                            }}
                                            isActive={chat.threadId === threadId}
                                            onDelete={(chatId) => {
                                                setDeleteId(chatId);
                                                setShowDeleteDialog(true);
                                            }}
                                            setOpenMobile={setOpenMobile}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </SidebarMenu>

                    <motion.div
                        onViewportEnter={() => {
                            if (status === "CanLoadMore") {
                                loadMore(PAGE_SIZE);
                            }
                        }}
                    />

                    {hasReachedEnd ? (
                        <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2 mt-8">
                            You have reached the end of your chat history.
                        </div>
                    ) : (
                        <div className="p-2 text-zinc-500 dark:text-zinc-400 flex flex-row gap-2 items-center mt-8">
                            <div className="animate-spin">
                                <LoaderIcon />
                            </div>
                            <div>Loading Chats...</div>
                        </div>
                    )}
                </SidebarGroupContent>
            </SidebarGroup>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            chat and remove it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
