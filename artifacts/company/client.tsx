// eslint-disable-next-line import/no-unresolved
import { Artifact } from '@/components/artifact/create-artifact';
import { DocumentSkeleton } from '@/components/artifact/document-skeleton';
import {
  ClockRewind,
  CopyIcon,
  MessageIcon,
  PenIcon,
  RedoIcon,
  UndoIcon,
} from '@/components/icons';
import type { Suggestion } from '@/lib/db/schema';
import { toast } from 'sonner';
import { getSuggestions } from '../actions';
import OrchestratorDag from '@/components/orchestrator/orchestrator-dag';
import type { DAG } from '@/lib/validators/schema';
import { ReactFlowProvider } from '@xyflow/react';

interface CompanyArtifactMetadata {
  suggestions: Array<Suggestion>;
}

export const companyArtifact = new Artifact<'company', CompanyArtifactMetadata>(
  {
    kind: 'company',
    description:
      'A UI to view your company, its employee agents and workflows.',
    initialize: async ({ documentId, setMetadata }) => {
      const suggestions = await getSuggestions({ documentId });

      setMetadata((metadata) => ({
        suggestions,
      }));
    },
    onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
      if (streamPart.type === 'suggestion') {
        setMetadata((metadata) => {
          return {
            suggestions: [
              ...metadata.suggestions,
              streamPart.content as Suggestion,
            ],
          };
        });
      }

      if (streamPart.type === 'workflow-delta') {
        setArtifact((draftArtifact) => {
          return {
            ...draftArtifact,
            content: streamPart.content as string,
            isVisible:
              draftArtifact.status === 'streaming' &&
              draftArtifact.content.length > 400 &&
              draftArtifact.content.length < 450
                ? true
                : draftArtifact.isVisible,
            status: 'streaming',
          };
        });
      }
    },
    content: ({
      mode,
      status,
      content,
      isCurrentVersion,
      currentVersionIndex,
      onSaveContent,
      getDocumentContentById, // Used for diff view
      isLoading,
      metadata,
    }) => {
      if (isLoading) {
        return <DocumentSkeleton artifactKind="text" />;
      }

      const dag = JSON.parse(content) as DAG;

      return (
        <>
          <ReactFlowProvider>
            <div className="flex flex-row py-8 md:p-20 px-4">
              <OrchestratorDag
                dag={dag}
                onSaveContent={onSaveContent}
                status={status}
                isCurrentVersion={isCurrentVersion}
                currentVersionIndex={currentVersionIndex}
                suggestions={metadata ? metadata.suggestions : []}
              />

              {metadata?.suggestions && metadata.suggestions.length > 0 ? (
                <div className="md:hidden h-dvh w-12 shrink-0" />
              ) : null}
            </div>
          </ReactFlowProvider>
        </>
      );
    },
    actions: [
      {
        icon: <ClockRewind size={18} />,
        description: 'View changes',
        onClick: ({ handleVersionChange }) => {
          handleVersionChange('toggle');
        },
        isDisabled: ({ currentVersionIndex, setMetadata }) => {
          if (currentVersionIndex === 0) {
            return true;
          }

          return false;
        },
      },
      {
        icon: <UndoIcon size={18} />,
        description: 'View Previous version',
        onClick: ({ handleVersionChange }) => {
          handleVersionChange('prev');
        },
        isDisabled: ({ currentVersionIndex }) => {
          if (currentVersionIndex === 0) {
            return true;
          }

          return false;
        },
      },
      {
        icon: <RedoIcon size={18} />,
        description: 'View Next version',
        onClick: ({ handleVersionChange }) => {
          handleVersionChange('next');
        },
        isDisabled: ({ isCurrentVersion }) => {
          if (isCurrentVersion) {
            return true;
          }

          return false;
        },
      },
      {
        icon: <CopyIcon size={18} />,
        description: 'Copy to clipboard',
        onClick: ({ content }) => {
          navigator.clipboard.writeText(content);
          toast.success('Copied to clipboard!');
        },
      },
    ],
    toolbar: [
      {
        icon: <PenIcon />,
        description: 'Add final polish',
        onClick: ({ appendMessage }) => {
          appendMessage({
            role: 'user',
            content:
              'Please add final polish and check for grammar, add section titles for better structure, and ensure everything reads smoothly.',
          });
        },
      },
      {
        icon: <MessageIcon />,
        description: 'Request suggestions',
        onClick: ({ appendMessage }) => {
          appendMessage({
            role: 'user',
            content:
              'Please add suggestions you have that could improve the writing.',
          });
        },
      },
    ],
  },
);
