import type { Attachment } from 'ai';
import { memo, useCallback, useEffect, useState } from 'react';
import { ChatHeader } from '@/components/chat/chat-header';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages/messages';
import { useArtifactStore } from '@/hooks/use-artifact';
// import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { optimisticallySendMessage, toUIMessages, useThreadMessages } from '@convex-dev/agent/react';
import { useChatStore } from '@/lib/store/chat-store';
import type { MessageDoc } from '@convex-dev/agent';
import { Artifact } from '../artifact/artifact';

const PureChat = ({
  threadId,
  mainParticipantId,
  isReadonly,
}: {
  threadId: string;
  mainParticipantId: string;
  isReadonly: boolean;
}) => {

  const messages = useThreadMessages(
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
    await sendMessage({ threadId, prompt })
    setPrompt('');
  }, [threadId, prompt, sendMessage]);

  const votes = useQuery(api.votes.getVotesByThreadId, {
    threadId,
  });

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const { modelId, initialVisibilityType } = useChatStore();
  const isArtifactVisible = useArtifactStore((state) => state.isVisible);

  useEffect(() => {
    const latestStatus = messages.results[messages.results.length - 1]?.status;
    if (latestStatus) {
      if (latestStatus === 'success' || latestStatus === 'failed') {
        setStatus('ready');
      } else {
        setStatus(latestStatus);
      }
    }
  }, [messages.results]);

  return (
    <>
      <div className="ml-4 flex flex-col min-w-0 bg-background h-full w-full">
        <ChatHeader
          chatId={threadId}
          selectedModelId={modelId}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={threadId}
          status={status}
          votes={votes}
          messages={toUIMessages(messages.results)}
          // setMessages={setMessages}
          // reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
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
              messages={toUIMessages(messages.results)}
              // setMessages={setMessages}
              append={async () => {
                await handleSubmit();
                return null;
              }}
              selectedVisibilityType={"public"} // TODO: add visibility type
            />
          )}
        </form>
      </div>

      <Artifact
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
        messages={toUIMessages(messages.results)}
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

  return true;
});