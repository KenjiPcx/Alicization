'use client';

import type { UIMessage } from 'ai';
import { PreviewMessage, ThinkingMessage } from './message';
import { Greeting } from '../greeting';
import { memo, useState } from 'react';
import equal from 'fast-deep-equal';
import { motion } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';
import type { Vote } from '@/lib/types';
import type { MessageDoc } from '@convex-dev/agent';
import { PaginationStatus } from 'convex/react';

interface MessagesProps {
  chatId: string;
  status: "ready" | "submitted" | MessageDoc["status"];
  votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  isReadonly: boolean;
  chatMode?: 'direct' | 'team';
  loadMoreMessages: () => void;
  isLoading: boolean;
  messagesStatus: PaginationStatus;
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  isReadonly,
  chatMode = 'direct',
  loadMoreMessages,
  isLoading,
  messagesStatus,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessages({
    chatId,
    status,
  });

  const handleLoadMore = () => {
    loadMoreMessages();
  };

  return (
    <div
      ref={messagesContainerRef}
      className={`flex flex-col min-w-0 gap-5 flex-1 overflow-y-scroll pt-4 relative ${chatMode === 'team' ? 'messages-team-mode' : 'messages-direct-mode'
        }`}
    >
      {messages.length > 0 && messagesStatus === 'CanLoadMore' && (
        <div className="flex justify-center pb-4">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-100 dark:disabled:hover:bg-zinc-800 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border border-zinc-400 border-t-transparent rounded-full" />
                Loading...
              </>
            ) : (
              'Load More Messages'
            )}
          </button>
        </div>
      )}

      {messages.length === 0 && <Greeting />}

      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          isLoading={status === 'pending' && messages.length - 1 === index}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          isReadonly={isReadonly}
          requiresScrollPadding={
            hasSentMessage && index === messages.length - 1
          }
          isLatestMessage={index === messages.length - 1}
        />
      ))}

      {status === 'submitted' &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

      <motion.div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px]"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (prevProps.chatMode !== nextProps.chatMode) return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.messagesStatus !== nextProps.messagesStatus) return false;

  return true;
});
