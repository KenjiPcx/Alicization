'use client';

import type { UIMessage } from 'ai';
import { PreviewMessage, ThinkingMessage } from './message';
import { Greeting } from '../greeting';
import { memo } from 'react';
import equal from 'fast-deep-equal';
import { motion } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';
import type { Vote } from '@/lib/types';
import type { MessageDoc } from '@convex-dev/agent';

interface MessagesProps {
  chatId: string;
  status: "ready" | "submitted" | MessageDoc["status"];
  votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  isReadonly: boolean;
  chatMode?: 'direct' | 'team';
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  isReadonly,
  chatMode = 'direct',
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

  return (
    <div
      ref={messagesContainerRef}
      className={`flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 relative ${chatMode === 'team' ? 'messages-team-mode' : 'messages-direct-mode'
        }`}
    >
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
        className="shrink-0 min-w-[24px] min-h-[24px]"
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

  return true;
});
