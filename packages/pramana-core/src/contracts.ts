import type {
  JsonObject,
  PromptSpec,
  RequestMetadata,
  ResponseMetadata,
  PromptMessage,
  TextResult,
} from './types';

export type PramanaInputBase = {
  tradition?: string | null;
  language?: string | null;
};

export type MeaningGenerateInput = PramanaInputBase & {
  entryId: string;
  sourceMeaning: string;
  sourceLabel?: string;
  targetLanguage: 'en' | 'hi' | 'pa';
};

export type RetrievalContextDocument = {
  content: string;
  metadata?: Record<string, any>;
};

export type PathshalaExplainInput = PramanaInputBase & {
  sanskrit?: string;
  transliteration?: string;
  translation?: string;
  source?: string;
  title?: string;
  retrievedChunks?: RetrievalContextDocument[];
};

export type AIChatInput = PramanaInputBase & {
  message: string;
  sampradaya?: string | null;
  city?: string | null;
  country?: string | null;
  seeking?: string[];
  history?: PromptMessage[];
};

export interface PramanaContract<
  TTask extends string = string,
  TInput = unknown,
  TOutput = unknown,
> {
  task: TTask;
  buildRequestMetadata(input: TInput): RequestMetadata<TTask>;
  validateInput(input: TInput): void;
  buildPrompt(input: TInput): PromptSpec;
  parseResult?(result: TextResult, input: TInput): TOutput;
}

export interface ContextBuilder<TInput = unknown, TContext = JsonObject> {
  build(input: TInput): Promise<TContext> | TContext;
}

export interface Policy<TInput = unknown, TTask extends string = string> {
  name: string;
  evaluate(input: TInput, meta: RequestMetadata<TTask>): void | Promise<void>;
}

export interface ModelAdapter {
  generate(prompt: PromptSpec): Promise<TextResult>;
}

export type RouteExecution<TTask extends string = string, TOutput = unknown> = {
  task: TTask;
  raw: string;
  output?: TOutput;
  metadata: ResponseMetadata<TTask>;
};
