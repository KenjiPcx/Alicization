import React from 'react';
import { useMicroApp } from '@/hooks/use-micro-app';
import { Artifact } from '@/components/micro-apps/artifact/artifact';
import { OfficeMicroApp } from '@/components/micro-apps/office/office-micro-app';
import type { Attachment, UIMessage } from 'ai';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from '@/components/chat/visibility-selector';
import type { Vote } from '@/lib/types';
import type { Dispatch, SetStateAction } from 'react';

interface MicroAppContainerProps {
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

export function MicroAppContainer(props: MicroAppContainerProps) {
  const { microAppType, microAppData } = useMicroApp();

  if (microAppType === 'office' && microAppData) {
    return (
      <OfficeMicroApp
        microAppType={microAppData.microAppType}
        microAppData={microAppData.data}
        title={microAppData.title}
      />
    );
  }

  if (microAppType === 'artifact') {
    return <Artifact {...props} />;
  }

  return null;
} 