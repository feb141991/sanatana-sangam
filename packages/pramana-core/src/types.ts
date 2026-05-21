import type { PramanaFeatureTask } from './feature-tasks';

export type PramanaProviderId = string;

export type VisibilityScope = string;

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export type PromptMessageRole = 'system' | 'user' | 'assistant' | 'tool';

export type PromptMessage = {
  role: PromptMessageRole;
  content: string;
};

export type PromptSpec = {
  system?: string;
  user?: string;
  messages?: PromptMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  /**
   * Provider-agnostic reasoning effort hint.
   * - 'none'   → disable chain-of-thought (fastest, lowest token cost)
   * - 'low'    → light reasoning (~1024 thinking tokens on Sarvam)
   * - 'medium' → moderate reasoning (~4096 thinking tokens on Sarvam)
   * - 'high'   → deep reasoning (~8192 thinking tokens on Sarvam)
   * Providers that do not support thinking (Gemini, generic self-hosted) ignore this field.
   */
  reasoningEffort?: 'none' | 'low' | 'medium' | 'high';
};

export type RequestMetadata<TTask extends string = PramanaFeatureTask> = {
  task: TTask;
  tradition?: string | null;
  language?: string | null;
  scope: VisibilityScope[];
  tags?: string[];
  attributes?: Record<string, string | number | boolean | null | undefined>;
};

export type ResponseMetadata<TTask extends string = PramanaFeatureTask> = {
  task: TTask;
  provider: PramanaProviderId;
  model: string;
  privateStackReady: boolean;
  usedHostedFallback: boolean;
  latencyMs?: number;
};

export type TextResult = {
  text: string;
  modelUsed: string;
  provider: PramanaProviderId;
  finishReason?: string;
};
