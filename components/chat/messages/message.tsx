'use client';

import type { UIMessage } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/types';
import { PencilEditIcon, SparklesIcon } from '@/components/icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from '../preview-attachment';
import equal from 'fast-deep-equal';
import { cn, sanitizeText } from '@/lib/utils';
import { Button } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { MessageEditor } from './message-editor';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import { SourceCard, type SourceDataType } from '../source-card';
import { useChatStore } from '@/lib/store/chat-store';
import {
  DefaultToolPreview,
  DocumentPreview,
  DocumentToolCall,
  DocumentToolResult,
  HumanCollabPreview,
  InterpreterPreview,
  LearnSkillPreview,
  MemorySearchPreview,
  MemorySetPreview,
  MicroAppResult,
  TodoListPreview,
  WebSearchPreview,
  WebSearchResults,
  FileIngestionPreview,
  KnowledgeSearchPreview,
  KnowledgeSearchResults
} from './tool-previews';

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  // setMessages,
  // reload,
  isReadonly,
  requiresScrollPadding,
  isLatestMessage
}: {
  chatId: string;
  message: UIMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  // setMessages: UseChatHelpers['setMessages'];
  // reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  isLatestMessage: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const { setFileViewerOpen, setFileViewerUrl, setFileViewerTitle } =
    useChatStore();
  let citationCounter = 1;

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message mb-5"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div
            className={cn('flex flex-col gap-4 w-full', {
              'min-h-96': message.role === 'assistant' && requiresScrollPadding,
            })}
          >
            {message.experimental_attachments &&
              message.experimental_attachments.length > 0 && (
                <div
                  data-testid={`message-attachments`}
                  className="flex flex-row justify-end gap-2"
                >
                  {message.experimental_attachments.map((attachment) => (
                    <PreviewAttachment
                      key={attachment.url}
                      attachment={attachment}
                    />
                  ))}
                </div>
              )}

            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning') {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.reasoning}
                  />
                );
              }

              if (type === 'source') {
                const sourceData = part.source as SourceDataType;
                return (
                  <div key={`${type}-${index}-${message.id}`} className="mt-2">
                    <SourceCard
                      source={sourceData}
                      citationNumber={citationCounter++}
                      onViewSource={(fileUrl, title) => {
                        setFileViewerOpen(true);
                        setFileViewerUrl(fileUrl);
                        setFileViewerTitle(title || '');
                      }}
                    />
                  </div>
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      {message.role === 'user' && !isReadonly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              data-testid="message-edit-button"
                              variant="ghost"
                              className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                              onClick={() => {
                                setMode('edit');
                              }}
                            >
                              <PencilEditIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit message</TooltipContent>
                        </Tooltip>
                      )}

                      <div
                        data-testid="message-content"
                        className={cn('flex flex-col gap-4', {
                          'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                            message.role === 'user',
                        })}
                      >
                        <Markdown>{part.text}</Markdown>
                      </div>
                    </div>
                  );
                }

                // if (mode === 'edit') {
                //   return (
                //     <div key={key} className="flex flex-row gap-2 items-start">
                //       <div className="size-8" />

                //       <MessageEditor
                //         key={message.id}
                //         message={message}
                //         setMode={setMode}
                //         setMessages={setMessages}
                //         reload={reload}
                //       />
                //     </div>
                //   );
                // }
              }

              if (type === 'tool-invocation') {
                const { toolInvocation } = part;
                const { toolName, toolCallId, state } = toolInvocation;

                if (state === 'call') {
                  const { args } = toolInvocation;

                  return (
                    <div
                      key={toolCallId}
                      className={cx({
                        skeleton: ['getWeather'].includes(toolName),
                      })}
                    >
                      {(() => {
                        switch (toolName) {
                          case 'openOfficeMicroApp':
                            return (
                              <div className="p-4 border rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                  Opening {args.name}...
                                </p>
                              </div>
                            );

                          case 'createArtifact':
                            return <DocumentPreview
                              isReadonly={isReadonly}
                              args={args}
                              toolCallId={toolCallId}
                            />;
                          case 'updateArtifact':
                            return (
                              <DocumentToolCall
                                type="update"
                                args={args}
                                isReadonly={isReadonly}
                                toolCallId={toolCallId}
                              />
                            );
                          case 'webSearch':
                            return <WebSearchPreview
                              args={args}
                              toolCallId={toolCallId}
                            />;
                          case 'setPlanAndTodos':
                          case 'selectNextTodo':
                          case 'completeCurrentTodoAndMoveToNextTodo':
                          case 'setTaskStatus':
                            return <TodoListPreview
                              args={args}
                              toolCallId={toolCallId}
                              toolName={toolName}
                              threadId={chatId}
                            />;
                          case 'setMemory':
                            return <MemorySetPreview
                              args={args}
                              toolCallId={toolCallId}
                              threadId={chatId}
                            />;
                          case 'searchMemories':
                            return <MemorySearchPreview
                              args={args}
                              toolCallId={toolCallId}
                              threadId={chatId}
                            />;
                          case 'useInterpreter':
                            return <InterpreterPreview
                              args={args}
                              toolCallId={toolCallId}
                            />;
                          case 'requestHumanInput':
                            return <HumanCollabPreview
                              args={args}
                              toolCallId={toolCallId}
                            />;
                          case 'learnSkill':
                            return <LearnSkillPreview
                              args={args}
                              toolCallId={toolCallId}
                            />;
                          case 'saveAttachment':
                            return <FileIngestionPreview
                              args={args}
                              toolCallId={toolCallId}
                            />;
                          case 'companyFileSearch':
                            return <KnowledgeSearchPreview
                              args={args}
                              toolCallId={toolCallId}
                            />;
                          default:
                            return null;
                        }
                      })()}
                    </div>
                  );
                }

                if (state === 'result') {
                  const { args, result } = toolInvocation;

                  return (
                    <div key={`${toolCallId}-result`}>
                      {(() => {
                        switch (toolName) {
                          case 'openOfficeMicroApp':
                            return (
                              <MicroAppResult
                                result={result}
                                toolCallId={toolCallId}
                                isReadonly={isReadonly}
                                autoOpen={isLatestMessage}
                              />
                            );
                          case 'createArtifact':
                            return (
                              <DocumentPreview
                                isReadonly={isReadonly}
                                result={result}
                                toolCallId={toolCallId}
                              />
                            );
                          case 'updateArtifact':
                            return (
                              <DocumentToolResult
                                type="update"
                                result={result}
                                isReadonly={isReadonly}
                              />
                            );
                          case 'requestSuggestions':
                            return (
                              <DocumentToolResult
                                type="request-suggestions"
                                result={result}
                                isReadonly={isReadonly}
                              />
                            );
                          case 'webSearch':
                            return <WebSearchResults results={result} />;
                          case 'setPlanAndTodos':
                          case 'selectNextTodo':
                          case 'completeCurrentTodoAndMoveToNextTodo':
                          case 'setTaskStatus':
                            return <TodoListPreview
                              args={{}}
                              toolCallId={toolCallId}
                              toolName={toolName}
                              threadId={chatId}
                              result={result}
                            />;
                          case 'setMemory':
                            return <MemorySetPreview
                              args={{}}
                              toolCallId={toolCallId}
                              threadId={chatId}
                              result={result}
                            />;
                          case 'searchMemories':
                            return <MemorySearchPreview
                              args={args}
                              toolCallId={toolCallId}
                              threadId={chatId}
                              result={result}
                            />;
                          case 'useInterpreter':
                            return <InterpreterPreview
                              args={args}
                              toolCallId={toolCallId}
                              result={result}
                            />;
                          case 'requestHumanInput':
                            return <HumanCollabPreview
                              args={args}
                              toolCallId={toolCallId}
                              result={result}
                            />;
                          case 'learnSkill':
                            return <LearnSkillPreview
                              args={args}
                              toolCallId={toolCallId}
                              result={result}
                            />;
                          case 'saveAttachment':
                            return <FileIngestionPreview
                              args={args}
                              toolCallId={toolCallId}
                              result={result}
                            />;
                          case 'companyFileSearch':
                            return <KnowledgeSearchResults
                              results={result}
                            />;
                          default:
                            return <DefaultToolPreview
                              toolName={toolName}
                              args={args}
                              result={result}
                              toolCallId={toolCallId}
                            />;
                        }
                      })()}
                    </div>
                  );
                }
              }
            })}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;

    // Compare key message properties that change during streaming
    const prevMsg = prevProps.message;
    const nextMsg = nextProps.message;

    if (prevMsg.id !== nextMsg.id) return false;

    if (prevMsg.parts?.length !== nextMsg.parts?.length) return false;
    if (!equal(prevMsg.parts, nextMsg.parts)) return false;
    if (prevMsg.content !== nextMsg.content) return false;
    if (prevMsg.role !== nextMsg.role) return false;
    if ((prevMsg as any).status !== (nextMsg as any).status) return false;
    if ((prevMsg as any).finishReason !== (nextMsg as any).finishReason) return false;

    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message min-h-96"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Hmm...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
