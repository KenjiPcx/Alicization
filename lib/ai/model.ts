import { google } from "@ai-sdk/google";
import { xai } from '@ai-sdk/xai';
import { openai } from '@ai-sdk/openai';
import { anthropic, type AnthropicProviderOptions } from '@ai-sdk/anthropic';

// export const model = google('gemini-2.5-pro-preview-05-06')
export const imageModel = xai.image('grok-2-image')
export const iconModel = openai.image('dall-e-3')
export const speechModel = openai.speech('tts-1')
export const embeddingModel = openai.embedding('text-embedding-3-small')
export const summaryModel = google('gemini-2.5-pro-preview-05-06')
export const quickSummaryModel = openai('gpt-4o')

export const model = anthropic('claude-4-sonnet-20250514')
export const anthropicProviderOptions = {
    anthropic: {
        thinking: { type: 'enabled', budgetTokens: 15000 },
    } satisfies AnthropicProviderOptions,
}