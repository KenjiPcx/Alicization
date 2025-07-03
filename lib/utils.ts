import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ErrorCode } from "./errors";
import { ChatSDKError } from "./errors";
import type { CoreAssistantMessage, CoreToolMessage, UIMessage } from "ai";
import type { Artifact } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to get a random item
export const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      'An error occurred while fetching the data.',
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};


export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const { code, cause } = await response.json();
      throw new ChatSDKError(code as ErrorCode, cause);
    }

    return response;
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat');
    }

    throw error;
  }
}

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: Array<UIMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getArtifactTimestampByIndex(
  artifacts: Array<Artifact>,
  index: number,
) {
  if (!artifacts) return new Date();
  if (index > artifacts.length) return new Date();

  return artifacts[index]._creationTime;
}

export function getTrailingMessageId({
  messages,
}: {
  messages: Array<ResponseMessage>;
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) return null;

  return trailingMessage.id;
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

// Smoothing for data writer
export const artificiallyStreamText = function* (text: string) {
  // Split sentence into words, and send 3 words at a time
  const words = text.split(' ');
  for (let i = 0; i < words.length; i += 3) {
    const endIndex = i + 3 > words.length ? undefined : i + 3;
    const chunk = words.slice(i, endIndex).join(' ');
    yield chunk;
  }
};