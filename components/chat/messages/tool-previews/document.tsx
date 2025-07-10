'use client';

import { memo } from 'react';

import { FileIcon, LoaderIcon, MessageIcon, PencilEditIcon } from '../../../icons';
import { toast } from 'sonner';
import type { ArtifactKind } from '@/lib/types';
import { useMicroApp } from '@/hooks/use-micro-app';

const getActionText = (
  type: 'create' | 'update' | 'request-suggestions',
  tense: 'present' | 'past',
) => {
  switch (type) {
    case 'create':
      return tense === 'present' ? 'Creating' : 'Created';
    case 'update':
      return tense === 'present' ? 'Updating' : 'Updated';
    case 'request-suggestions':
      return tense === 'present'
        ? 'Adding suggestions'
        : 'Added suggestions to';
    default:
      return null;
  }
};

interface DocumentToolResultProps {
  type: 'create' | 'update' | 'request-suggestions';
  result: { toolCallId: string; title: string; kind: ArtifactKind };
  isReadonly: boolean;
}

function PureDocumentToolResult({
  type,
  result,
  isReadonly,
}: DocumentToolResultProps) {
  const { openArtifactMicroApp } = useMicroApp();

  return (
    <button
      type="button"
      className="bg-background cursor-pointer border border-gray-200 dark:border-gray-700 py-2 px-3 rounded-xl w-fit flex flex-row gap-3 items-start hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      onClick={(event) => {
        if (isReadonly) {
          toast.error(
            'Viewing files in shared chats is currently not supported.',
          );
          return;
        }

        const rect = event.currentTarget.getBoundingClientRect();

        const boundingBox = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };

        openArtifactMicroApp(result.toolCallId, boundingBox);
      }}
    >
      <div className="text-muted-foreground mt-1">
        {type === 'create' ? (
          <FileIcon />
        ) : type === 'update' ? (
          <PencilEditIcon />
        ) : type === 'request-suggestions' ? (
          <MessageIcon />
        ) : null}
      </div>
      <div className="text-left text-gray-900 dark:text-gray-100">
        {`${getActionText(type, 'past')} "${result.title}"`}
      </div>
    </button>
  );
}

export const DocumentToolResult = memo(PureDocumentToolResult, () => true);

interface DocumentToolCallProps {
  type: 'create' | 'update' | 'request-suggestions';
  args: { title: string };
  isReadonly: boolean;
  toolCallId: string;
}

function PureDocumentToolCall({
  type,
  args,
  isReadonly,
  toolCallId,
}: DocumentToolCallProps) {
  const { openArtifactMicroApp } = useMicroApp();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isReadonly) {
      toast.error(
        'Viewing files in shared chats is currently not supported.',
      );
      return;
    }

    const rect = event.currentTarget?.getBoundingClientRect();

    openArtifactMicroApp(toolCallId, {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  };

  return (
    <button
      type="button"
      className="w-fit border border-gray-200 dark:border-gray-700 py-2 px-3 rounded-xl flex flex-row items-start justify-between gap-3 bg-background"
      onClick={handleClick}
    >
      <div className="flex flex-row gap-3 items-start">
        <div className="text-zinc-500 dark:text-zinc-400 mt-1">
          {type === 'create' ? (
            <FileIcon />
          ) : type === 'update' ? (
            <PencilEditIcon />
          ) : type === 'request-suggestions' ? (
            <MessageIcon />
          ) : null}
        </div>

        <div className="text-left text-gray-900 dark:text-gray-100">
          {`${getActionText(type, 'present')} ${args.title ? `"${args.title}"` : ''}`}
        </div>
      </div>

      <div className="animate-spin mt-1 text-gray-500 dark:text-gray-400">
        <LoaderIcon />
      </div>
    </button>
  );
}

export const DocumentToolCall = memo(PureDocumentToolCall, () => true);
