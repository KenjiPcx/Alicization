import { memo, useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useMicroApp } from '@/hooks/use-micro-app';
import { AnimatePresence, motion } from 'framer-motion';
import { ArtifactCloseButton } from './artifact-close-button';
import { useWindowSize } from 'usehooks-ts';
import { MultimodalInput } from '../../chat/multimodal-input';
import { MicroAppMessages } from './micro-app-messages';
import { formatDistance } from 'date-fns';
import type { Attachment, UIMessage } from 'ai';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from '../../chat/visibility-selector';
import type { Dispatch, SetStateAction } from 'react';
import type { ArtifactKind, Vote } from '@/lib/types';
import equal from 'fast-deep-equal';
import { VersionFooter } from './version-footer';
import { ArtifactActions } from './artifact-actions';
import { Toolbar } from './toolbar';
import { textArtifact } from '@/micro-apps/artifacts/text-client';
import { codeArtifact } from '@/micro-apps/artifacts/code-client';
import { imageArtifact } from '@/micro-apps/artifacts/image-client';
import { sheetArtifact } from '@/micro-apps/artifacts/sheet-client';


export const artifactDefinitions = [
  textArtifact,
  codeArtifact,
  imageArtifact,
  sheetArtifact,
];

interface ArtifactProps {
  chatId: string;
  input: string;
  setInput: UseChatHelpers['setInput'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  status: 'submitted' | 'ready' | 'pending' | 'failed' | 'success';
  stop: UseChatHelpers['stop'];
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  append: UseChatHelpers['append'];
  messages: Array<UIMessage>;
  votes: Array<Vote> | undefined;
  isReadonly: boolean;
  selectedVisibilityType: VisibilityType;
}

export function PureArtifact({
  chatId,
  input,
  setInput,
  handleSubmit,
  status,
  stop,
  attachments,
  setAttachments,
  append,
  messages,
  votes,
  isReadonly,
  selectedVisibilityType,
}: ArtifactProps) {
  const { toolCallId, isVisible, boundingBox, getMetadata, setMetadata } = useMicroApp();
  const [mode, setMode] = useState<'edit' | 'diff'>('edit');
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

  // Get all versions if this is part of a group
  const artifacts = useQuery(api.artifacts.getArtifactsByToolCallId,
    toolCallId ? { toolCallId } : "skip"
  );

  const artifact = artifacts?.[0];

  const isCurrentVersion =
    artifacts && artifacts.length > 0
      ? currentVersionIndex === artifacts.length - 1
      : true;

  useEffect(() => {
    if (artifacts && artifacts.length > 0) {
      setCurrentVersionIndex(artifacts.length - 1);
      console.log(artifacts[artifacts.length - 1])
    }
  }, [artifacts]);


  function getDocumentContentById(index: number) {
    if (!artifacts) return '';
    if (!artifacts[index]) return '';
    return artifacts[index].content ?? '';
  }

  const handleVersionChange = (type: 'next' | 'prev' | 'toggle' | 'latest') => {
    if (!artifacts) return;

    if (type === 'latest') {
      setCurrentVersionIndex(artifacts.length - 1);
      setMode('edit');
    }

    if (type === 'toggle') {
      setMode((mode) => (mode === 'edit' ? 'diff' : 'edit'));
    }

    if (type === 'prev') {
      if (currentVersionIndex > 0) {
        setCurrentVersionIndex((index) => index - 1);
      }
    } else if (type === 'next') {
      if (currentVersionIndex < artifacts.length - 1) {
        setCurrentVersionIndex((index) => index + 1);
      }
    }
  };

  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

  console.log(artifact?.kind)
  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact?.kind,
  );

  useEffect(() => {
    if (status !== 'pending' && artifactDefinition) {
      if (artifactDefinition.initialize) {
        artifactDefinition.initialize({
          artifactId: artifact?._id ?? '',
          setMetadata: () => { },
        });
      }
    }
  }, [status, artifactDefinition]);

  if (!artifactDefinition) {
    return null;
  }

  return (
    <AnimatePresence mode="wait" onExitComplete={() => console.log('Exit complete!')}>
      {isVisible && artifact && (
        <motion.div
          key="artifact"
          data-testid="artifact"
          className="flex flex-row h-[85dvh] w-[85dvw] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 overflow-hidden rounded-lg shadow-2xl bg-background"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.4 } }}
        >
          {/* Chat sidebar */}
          {!isMobile && (
            <motion.div
              className="relative w-[450px] bg-muted dark:bg-background h-full shrink-0"
              initial={{ opacity: 0, x: 10, scale: 1 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
                transition: {
                  delay: 0.2,
                  type: 'spring',
                  stiffness: 200,
                  damping: 30,
                },
              }}
              exit={{
                opacity: 0,
                x: 0,
                scale: 1,
                transition: { duration: 0 },
              }}
            >
              <AnimatePresence>
                {!isCurrentVersion && (
                  <motion.div
                    className="left-0 absolute h-full w-[400px] top-0 bg-zinc-900/50 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </AnimatePresence>

              <div className="flex flex-col h-full justify-between items-center">
                <MicroAppMessages
                  chatId={chatId}
                  status={status}
                  votes={votes}
                  messages={messages}
                  isReadonly={isReadonly}
                />

                <form className="flex flex-row gap-2 relative items-end w-full px-4 pb-4">
                  <MultimodalInput
                    chatId={chatId}
                    input={input}
                    setInput={setInput}
                    handleSubmit={handleSubmit}
                    status={status}
                    stop={stop}
                    attachments={attachments}
                    setAttachments={setAttachments}
                    messages={messages}
                    append={append}
                    className="bg-background dark:bg-muted"
                    selectedVisibilityType={selectedVisibilityType}
                  />
                </form>
              </div>
            </motion.div>
          )}

          {/* Main content with preserved animations */}
          <motion.div
            className="relative flex-1 dark:bg-muted bg-background h-full flex flex-col md:border-l dark:border-zinc-700 border-zinc-200"
            initial={{
              opacity: 1,
              x: boundingBox.left,
              y: boundingBox.top,
              height: boundingBox.height,
              width: boundingBox.width,
              borderRadius: 50,
            }}
            animate={{
              opacity: 1,
              x: 0,
              y: 0,
              height: '100%',
              width: '100%',
              borderRadius: 0,
              transition: {
                delay: 0,
                type: 'spring',
                stiffness: 200,
                damping: 30,
              },
            }}
            exit={{
              opacity: 0,
              scale: 0.5,
              transition: {
                delay: 0.1,
                type: 'spring',
                stiffness: 600,
                damping: 30,
              },
            }}
          >
            {/* Header */}
            <div className="p-2 flex flex-row justify-between items-start">
              <div className="flex flex-row gap-4 items-start">
                <ArtifactCloseButton />
                <div>
                  <div className="font-medium">{artifact.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {artifact.kind} • Updated {formatDistance(new Date(artifact._creationTime), new Date(), { addSuffix: true })}
                  </div>
                </div>
              </div>
              <ArtifactActions
                artifact={artifact}
                currentVersionIndex={currentVersionIndex}
                handleVersionChange={handleVersionChange}
                isCurrentVersion={isCurrentVersion}
                mode={mode}
                metadata={{}}
                setMetadata={() => { }}
                status={status}
              />
            </div>

            {/* Content */}
            <div className="dark:bg-muted bg-background h-full overflow-y-scroll !max-w-full items-center custom-scrollbar">
              <artifactDefinition.content
                title={artifact.title}
                content={
                  isCurrentVersion
                    ? artifact.content ?? ''
                    : getDocumentContentById(currentVersionIndex)
                }
                mode={mode}
                status={status === "pending" ? "streaming" : "idle"}
                currentVersionIndex={currentVersionIndex}
                suggestions={[]}
                onSaveContent={() => { }}
                isInline={false}
                isCurrentVersion={isCurrentVersion}
                getDocumentContentById={getDocumentContentById}
                isLoading={!artifact.content}
                metadata={getMetadata(artifact._id) ?? {}}
                setMetadata={(metadata) => setMetadata(artifact._id, metadata)}
              />

              <AnimatePresence>
                {isCurrentVersion && (
                  <Toolbar
                    isToolbarVisible={isToolbarVisible}
                    setIsToolbarVisible={setIsToolbarVisible}
                    append={append}
                    status={status}
                    stop={stop}
                    artifactKind={artifact.kind as ArtifactKind}
                  />
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {!isCurrentVersion && (
                <VersionFooter
                  currentVersionIndex={currentVersionIndex}
                  artifacts={artifacts ?? []}
                  handleVersionChange={handleVersionChange}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const Artifact = memo(PureArtifact, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (prevProps.input !== nextProps.input) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
    return false;

  return true;
});
