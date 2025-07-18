import type { UserType } from '@/lib/types';
import type { ChatModel } from '@/lib/ai/models-ui';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ['chat-model', 'chat-model-reasoning'],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
  pro: {
    maxMessagesPerDay: 1000,
    availableChatModelIds: ['chat-model', 'chat-model-reasoning'],
  },
};
