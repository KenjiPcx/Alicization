'use client';

import React, {
  memo,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { FileIcon, FullscreenIcon, ImageIcon, LoaderIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { InlineDocumentSkeleton } from './document-skeleton';
import { Editor } from '../../../micro-apps/artifact/text-editor';
import { DocumentToolCall, DocumentToolResult } from './document';
import { CodeEditor } from '../../../micro-apps/artifact/code-artifact/code-editor';
import { SpreadsheetEditor } from '../../../micro-apps/artifact/sheet-editor';
import { ImageEditor } from '../../../micro-apps/artifact/text-artifact/image-editor';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Artifact, ArtifactKind } from '@/lib/types';
import { useMicroApp } from '@/hooks/use-micro-app';

interface DocumentResponse {
  success: boolean;
  message: string;
  artifactId?: string;
  title?: string;
  kind?: ArtifactKind;
  content?: string;
}

interface DocumentPreviewProps {
  isReadonly: boolean;
  result?: DocumentResponse;
  args?: {
    title: string;
    type: ArtifactKind;
  };
  toolCallId: string;
}

export function DocumentPreview({
  isReadonly,
  result,
  args,
  toolCallId,
}: DocumentPreviewProps) {
  console.log("KEnji im calling documet tool call preview", toolCallId);
  const { openArtifactMicroApp, isVisible } = useMicroApp();
  const [autoOpened, setAutoOpened] = useState(false);
  const hitboxRef = useRef<HTMLDivElement>(null);

  // Subscribe to tool status for progress and auto-opening
  const backgroungJobStatus = useQuery(api.backgroundJobStatuses.getBackgroundJobStatus,
    { toolCallId }
  );

  const status = backgroungJobStatus?.statusUpdates?.[backgroungJobStatus.statusUpdates.length - 1]?.status;

  // Subscribe to artifact by statusId to get the actual content
  const artifact = useQuery(api.artifacts.getArtifactByToolCallId, { toolCallId });
  const title = artifact?.title || 'Untitled';
  const type = artifact?.kind || 'text';

  // Get artifacts by groupId if we have a completed artifact (for multiple versions)
  const artifacts = useQuery(api.artifacts.getArtifactsByGroupId,
    artifact?.artifactGroupId ? { artifactGroupId: artifact.artifactGroupId } : "skip"
  );

  const previewArtifact = artifacts?.[0] || artifact;

  // Auto-open when first progress message arrives or when micro-app artifact is ready
  useEffect(() => {
    if (status === "running" && !isVisible && !autoOpened) {
      // Only auto-open once
      setAutoOpened(true);
      setTimeout(() => {
        console.log("opening artifact")
      }, 2500) // Add a delay
      const boundingBox = hitboxRef.current?.getBoundingClientRect();
      if (boundingBox && previewArtifact) {
        openArtifactMicroApp(toolCallId, {
          top: boundingBox.y,
          left: boundingBox.x,
          width: boundingBox.width,
          height: boundingBox.height,
        });
      }
    }

    // Auto-open micro-apps immediately when they're ready
    if (!isVisible && !autoOpened) {
      setAutoOpened(true);
      const boundingBox = hitboxRef.current?.getBoundingClientRect();
      if (boundingBox) {
        openArtifactMicroApp(toolCallId, {
          top: boundingBox.y,
          left: boundingBox.x,
          width: boundingBox.width,
          height: boundingBox.height,
        });
      }
    }
  }, []);

  // If we have the artifact visible, show the tool result
  if (isVisible && previewArtifact) {
    if (result) {
      return (
        <DocumentToolResult
          type="create"
          result={{ toolCallId, title, kind: type }}
          structuredResult={result}
          isReadonly={isReadonly}
        />
      );
    }

    if (args) {
      return (
        <DocumentToolCall
          type="create"
          args={{ title: args.title }}
          structuredResult={result}
          isReadonly={isReadonly}
          toolCallId={toolCallId}
        />
      );
    }
  }

  // Loading state
  if (!backgroungJobStatus && !previewArtifact) {
    return <LoadingSkeleton artifactKind={type} />;
  }

  const currentStatus = backgroungJobStatus?.statusUpdates?.[backgroungJobStatus.statusUpdates.length - 1];
  const isInProgress = currentStatus?.status === "running";
  const isCompleted = currentStatus?.status === "completed";
  const isFailed = currentStatus?.status === "failed";

  // Show error state if we have a structured result with failure
  if (result && !result.success && (isCompleted || isFailed)) {
    return (
      <div className="relative w-full">
        <div className="border border-red-200 dark:border-red-700 rounded-xl p-4 bg-background">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-red-500">❌</div>
            <div className="font-medium text-red-600 dark:text-red-400">
              Document Creation Failed
            </div>
          </div>
          <div className="text-sm text-red-600 dark:text-red-400">
            {result.message}
          </div>
        </div>
      </div>
    );
  }

  // Create a document object for rendering
  const document = previewArtifact || {
    title,
    kind: type,
    content: '',
  };

  return (
    <div className="relative w-full cursor-pointer">
      <HitboxLayer
        hitboxRef={hitboxRef}
        toolCallId={toolCallId}
      />
      <DocumentHeader
        title={document.title}
        kind={document.kind}
        isStreaming={isInProgress}
        isSuccess={result?.success}
      />
      <DocumentContent
        document={document}
        isInProgress={isInProgress}
        structuredResult={result}
      />
    </div>
  );
}

const LoadingSkeleton = ({ artifactKind }: { artifactKind: string }) => (
  <div className="w-full">
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-t-2xl flex flex-row gap-2 items-center justify-between dark:bg-muted h-[57px] border-b-0">
      <div className="flex flex-row items-center gap-3">
        <div className="text-muted-foreground">
          <div className="animate-pulse rounded-md size-4 bg-muted-foreground/20" />
        </div>
        <div className="animate-pulse rounded-lg h-4 bg-muted-foreground/20 w-24" />
      </div>
      <div>
        <FullscreenIcon />
      </div>
    </div>
    {artifactKind === 'image' ? (
      <div className="overflow-y-scroll border border-gray-200 dark:border-gray-700 rounded-b-2xl bg-muted border-t-0">
        <div className="animate-pulse h-[257px] bg-muted-foreground/20 w-full" />
      </div>
    ) : (
      <div className="overflow-y-scroll border border-gray-200 dark:border-gray-700 rounded-b-2xl p-8 pt-4 bg-muted border-t-0">
        <InlineDocumentSkeleton />
      </div>
    )}
  </div>
);

const PureHitboxLayer = ({
  hitboxRef,
  toolCallId,
}: {
  hitboxRef: React.RefObject<HTMLDivElement | null>;
  toolCallId: string;
}) => {
  const { openArtifactMicroApp } = useMicroApp();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const boundingBox = event.currentTarget.getBoundingClientRect();

      openArtifactMicroApp(toolCallId, {
        top: boundingBox.y,
        left: boundingBox.x,
        width: boundingBox.width,
        height: boundingBox.height,
      });
    },
    [openArtifactMicroApp, toolCallId],
  );

  return (
    <div
      className="size-full absolute top-0 left-0 rounded-xl z-10"
      ref={hitboxRef}
      onClick={handleClick}
      role="presentation"
      aria-hidden="true"
    >
      <div className="w-full p-4 flex justify-end items-center">
        <div className="absolute right-[9px] top-[13px] p-2 hover:dark:bg-zinc-700 rounded-md hover:bg-zinc-100">
          <FullscreenIcon />
        </div>
      </div>
    </div>
  );
};

const HitboxLayer = memo(PureHitboxLayer, (prevProps, nextProps) => {
  if (prevProps.toolCallId !== nextProps.toolCallId) return false;
  return true;
});

const PureDocumentHeader = ({
  title,
  kind,
  isStreaming,
  isSuccess,
}: {
  title: string;
  kind: ArtifactKind;
  isStreaming: boolean;
  isSuccess?: boolean;
}) => (
  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-t-2xl flex flex-row gap-2 items-start sm:items-center justify-between dark:bg-muted border-b-0">
    <div className="flex flex-row items-start sm:items-center gap-3">
      <div className="text-muted-foreground">
        {isStreaming ? (
          <div className="animate-spin">
            <LoaderIcon />
          </div>
        ) : isSuccess ? (
          <div className="text-green-500">✅</div>
        ) : kind === 'image' ? (
          <ImageIcon />
        ) : (
          <FileIcon />
        )}
      </div>
      <div className="-translate-y-1 sm:translate-y-0 font-medium text-gray-900 dark:text-gray-100">{title}</div>
    </div>
    <div className="w-8" />
  </div>
);

const DocumentHeader = memo(PureDocumentHeader, (prevProps, nextProps) => {
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;
  if (prevProps.isSuccess !== nextProps.isSuccess) return false;
  return true;
});

const DocumentContent = ({ document, isInProgress, structuredResult }: {
  document: Artifact | {
    title: string;
    kind: ArtifactKind;
    content: string;
  };
  isInProgress: boolean;
  structuredResult?: DocumentResponse;
}) => {
  const containerClassName = cn(
    'h-[257px] overflow-y-scroll border border-gray-200 dark:border-gray-700 rounded-b-2xl dark:bg-muted border-t-0 custom-scrollbar',
    {
      'p-4 sm:px-14 sm:py-16': document.kind === 'text',
      'p-0': document.kind === 'code',
      'p-4': document.kind === 'sheet',
    },
  );

  const status = isInProgress ? 'streaming' as const : 'idle' as const;

  const commonProps = {
    content: document.content ?? '',
    isCurrentVersion: true,
    currentVersionIndex: 0,
    status: status,
    saveContent: () => { },
    suggestions: [],
  };

  return (
    <div className={containerClassName}>
      {document.kind === 'text' ? (
        <Editor {...commonProps} onSaveContent={() => { }} />
      ) : document.kind === 'code' ? (
        <div className="flex flex-1 relative w-full">
          <div className="absolute inset-0">
            <CodeEditor {...commonProps} onSaveContent={() => { }} />
          </div>
        </div>
      ) : document.kind === 'sheet' ? (
        <div className="flex flex-1 relative size-full">
          <div className="absolute inset-0">
            <SpreadsheetEditor {...commonProps} />
          </div>
        </div>
      ) : document.kind === 'image' ? (
        <ImageEditor
          title={document.title}
          content={document.content ?? ''}
          isCurrentVersion={true}
          currentVersionIndex={0}
          status={status}
          isInline={true}
        />
      ) : null}

      {/* Show success message when completed successfully */}
      {structuredResult?.success && status === 'idle' && (
        <div className="absolute top-2 right-2 bg-green-500/10 border border-green-500/20 rounded-lg px-2 py-1">
          <div className="text-xs text-green-600 dark:text-green-400 font-medium">
            ✅ Created successfully
          </div>
        </div>
      )}
    </div>
  );
};
