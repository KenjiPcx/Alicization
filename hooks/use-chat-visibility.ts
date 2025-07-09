'use client';

import { useMemo } from 'react';
import type { VisibilityType } from '@/components/chat/visibility-selector';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useChatVisibility({
  threadId,
  initialVisibilityType,
}: {
  threadId: string;
  initialVisibilityType: VisibilityType;
}) {
  const updateChatVisibilityMutation = useMutation(api.chat.updateChatVisibilityByThreadId);

  const visibilityType = useMemo(() => {
    return initialVisibilityType;
  }, [initialVisibilityType]);

  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    updateChatVisibilityMutation({
      threadId,
      visibility: updatedVisibilityType,
    });
  };

  return { visibilityType, setVisibilityType };
}