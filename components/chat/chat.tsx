'use client';

import type { Attachment } from 'ai';
import { memo, useCallback, useEffect, useState } from 'react';
import { ChatHeader } from '@/components/chat/chat-header';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages/messages';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { optimisticallySendMessage, toUIMessages, useThreadMessages } from '@convex-dev/agent/react';
import { useChatStore } from '@/lib/store/chat-store';
import type { MessageDoc } from '@convex-dev/agent';
import type { Id } from '@/convex/_generated/dataModel';
import { MicroAppContainer } from '../micro-apps/office/micro-app-container';

const PureChat = ({
  threadId,
  mainParticipantId,
  teamId,
  isReadonly,
  chatMode = 'direct',
}: {
  threadId: string;
  mainParticipantId: Id<"employees">;
  teamId: Id<"teams">;
  isReadonly: boolean;
  chatMode?: 'direct' | 'team';
}) => {

  const { results: messages, loadMore, isLoading, status: messagesStatus } = useThreadMessages(
    api.chat.listThreadMessages,
    { threadId },
    { initialNumItems: 10, stream: true },
  );
  const sendMessage = useMutation(
    api.chat.streamMessageAsync,
  ).withOptimisticUpdate(
    optimisticallySendMessage(api.chat.listThreadMessages),
  );
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<"ready" | "submitted" | MessageDoc["status"]>('ready');
  const handleSubmit = useCallback(async () => {
    setStatus('submitted');
    await sendMessage({ threadId, prompt, employeeId: mainParticipantId, teamId, sender: { type: "user" } })
    setPrompt('');
  }, [threadId, prompt, sendMessage, mainParticipantId, teamId]);

  const votes = useQuery(api.votes.getVotesByThreadId, {
    threadId,
  });

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const { modelId, initialVisibilityType } = useChatStore();

  useEffect(() => {
    const latestStatus = messages[messages.length - 1]?.status;
    if (latestStatus) {
      if (latestStatus === 'success' || latestStatus === 'failed') {
        setStatus('ready');
      } else {
        setStatus(latestStatus);
      }
    }
  }, [messages]);

  return (
    <>
      <div className={`ml-4 flex flex-col min-w-0 bg-background h-full w-full ${chatMode === 'team' ? 'chat-mode-team' : 'chat-mode-direct'
        }`}>
        <ChatHeader
          threadId={threadId}
          selectedModelId={modelId}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={threadId}
          status={status}
          votes={votes}
          messages={toUIMessages(messages)}
          isReadonly={isReadonly}
          chatMode={chatMode}
          loadMoreMessages={() => {
            loadMore(10);
          }}
          isLoading={isLoading}
          messagesStatus={messagesStatus}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={threadId}
              input={prompt}
              setInput={setPrompt}
              handleSubmit={handleSubmit}
              status={status}
              stop={() => {
                stop();
                setStatus('success');
              }}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={toUIMessages(messages)}
              append={async () => {
                await handleSubmit();
                return null;
              }}
              selectedVisibilityType={"public"} // TODO: add visibility type
              chatMode={chatMode}
            />
          )}
        </form>
      </div>

      <MicroAppContainer
        chatId={threadId}
        input={prompt}
        setInput={setPrompt}
        handleSubmit={handleSubmit}
        status={status}
        stop={() => {
          stop();
          setStatus('success');
        }}
        attachments={attachments}
        setAttachments={setAttachments}
        messages={toUIMessages(messages)}
        append={async () => {
          await handleSubmit();
          return null;
        }}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={initialVisibilityType}
      />
    </>
  );
}

export const Chat = memo(PureChat, (prevProps, nextProps) => {

  if (prevProps.threadId !== nextProps.threadId) return false;
  if (prevProps.isReadonly !== nextProps.isReadonly) return false;
  if (prevProps.mainParticipantId !== nextProps.mainParticipantId) return false;
  if (prevProps.teamId !== nextProps.teamId) return false;
  if (prevProps.chatMode !== nextProps.chatMode) return false;

  return true;
});