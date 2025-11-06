'use client';

import type { Attachment } from 'ai';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
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
import { MicroAppsSpeedDial } from './micro-apps-speed-dial';

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
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const { modelId, initialVisibilityType } = useChatStore();

  const handleSubmit = useCallback(async () => {
    setStatus('submitted');
    await sendMessage({
      threadId,
      prompt,
      employeeId: mainParticipantId,
      teamId,
      sender: { type: "user" },
      attachments
    })
    setPrompt('');
  }, [threadId, prompt, sendMessage, mainParticipantId, teamId, attachments]);

  const votes = useQuery(api.votes.getVotesByThreadId, {
    threadId,
  });

  // Memoize the UI messages transformation to prevent unnecessary re-renders
  const uiMessages = useMemo(() => toUIMessages(messages), [messages]);

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
      <div className={`ml-4 flex flex-col min-w-0 bg-background h-full w-full relative ${chatMode === 'team' ? 'chat-mode-team' : 'chat-mode-direct'
        }`}>
        <ChatHeader
          threadId={threadId}
          selectedModelId={modelId}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
        />

        <Messages
          threadId={threadId}
          status={status}
          votes={votes}
          messages={uiMessages}
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
              threadId={threadId}
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
              messages={uiMessages}
              append={async () => {
                await handleSubmit();
                return null;
              }}
              selectedVisibilityType={"public"} // TODO: add visibility type
              chatMode={chatMode}
            />
          )}
        </form>

        {/* Micro Apps Speed Dial - positioned within the chat container */}
        <MicroAppsSpeedDial
          mainParticipantId={mainParticipantId}
          chatId={threadId}
        />
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
        messages={uiMessages}
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