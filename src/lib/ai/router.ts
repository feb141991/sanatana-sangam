import { buildMeaningGeneratePrompt, buildPathshalaExplainPrompt } from '@/lib/ai/context-builder';
import { assertAiRequestAllowed, validateMeaningGenerateInput, validatePathshalaExplainInput, validateAIChatInput } from '@/lib/ai/policies';
import { generateWithGemini } from '@/lib/ai/providers/gemini';
import { retrievePathshalaContext } from '@/lib/ai/retrieval';
import { GeminiModelAdapter } from '@sangam/pramana-serve';
import { DharmaChatContract } from '@sangam/pramana-core';
import type {
  AIResponseMetadata,
  AITextResult,
  MeaningGenerateInput,
  PathshalaExplainInput,
  AIChatInput,
} from '@/lib/ai/contracts';

function buildMetadata(task: AIResponseMetadata['task'], result: AITextResult): AIResponseMetadata {
  return {
    task,
    provider: result.provider,
    model: result.modelUsed,
    privateStackReady: false,
    usedHostedFallback: true,
  };
}

export async function runPathshalaExplain(input: PathshalaExplainInput) {
  assertAiRequestAllowed({
    task: 'pathshala_explain',
    tradition: input.tradition,
    language: input.language,
    scope: ['public_corpus', 'user_preference_only'],
  });
  validatePathshalaExplainInput(input);

  const chunks = await retrievePathshalaContext({
    source: input.source,
    title: input.title,
    tradition: input.tradition,
  });

  // Keep behavior identical for now, but pass retrieved context if available
  const built = buildPathshalaExplainPrompt({
    ...input,
    retrievedChunks: chunks,
  });
  const result = await generateWithGemini(built.prompt);

  return {
    raw: result.text,
    teacher: built.teacher,
    school: built.school,
    metadata: buildMetadata('pathshala_explain', result),
  };
}

export async function runMeaningGenerate(input: MeaningGenerateInput) {
  assertAiRequestAllowed({
    task: 'meaning_generate',
    language: input.targetLanguage,
    scope: ['public_corpus'],
  });
  validateMeaningGenerateInput(input);

  const prompt = buildMeaningGeneratePrompt(input);
  const result = await generateWithGemini(prompt);

  return {
    raw: result.text,
    metadata: buildMetadata('meaning_generate', result),
  };
}

export async function runDharmaChat(input: AIChatInput) {
  assertAiRequestAllowed({
    task: 'ai_chat',
    tradition: input.tradition,
    language: input.language,
    scope: ['user_preference_only'],
  });
  validateAIChatInput(input);

  const contract = DharmaChatContract;
  const prompt = contract.buildPrompt(input);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // Determine model priority: env override → default → fallback
  const envModel = process.env.GEMINI_MODEL?.trim();
  const models = envModel
    ? [envModel, 'gemini-2.0-flash-lite']
    : ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];

  const adapter = new GeminiModelAdapter({
    apiKey,
    models,
  });

  const result = await adapter.generate(prompt);

  return {
    raw: result.text,
    metadata: buildMetadata('ai_chat', {
      text: result.text,
      modelUsed: result.modelUsed,
      provider: result.provider,
    }),
  };
}
