export type AIProviderId = 'gemini';

export type AITaskKind =
  | 'pathshala_explain'
  | 'meaning_generate';

export type AIVisibilityScope =
  | 'public_corpus'
  | 'user_preference_only';

export type AIRequestMetadata = {
  task: AITaskKind;
  tradition?: string | null;
  language?: string | null;
  scope: AIVisibilityScope[];
};

export type PathshalaExplainInput = {
  sanskrit?: string;
  transliteration?: string;
  translation?: string;
  source?: string;
  title?: string;
  tradition?: string | null;
  language?: string | null;
};

export type MeaningGenerateInput = {
  entryId: string;
  sourceMeaning: string;
  sourceLabel?: string;
  targetLanguage: 'en' | 'hi' | 'pa';
};

export type AIPromptSpec = {
  system?: string;
  user: string;
  temperature?: number;
  maxOutputTokens?: number;
};

export type AITextResult = {
  text: string;
  modelUsed: string;
  provider: AIProviderId;
};

export type AIResponseMetadata = {
  task: AITaskKind;
  provider: AIProviderId;
  model: string;
  privateStackReady: boolean;
  usedHostedFallback: boolean;
};
