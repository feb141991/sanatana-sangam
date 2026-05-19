import { buildMeaningGeneratePrompt, buildPathshalaExplainPrompt } from '@/lib/ai/context-builder';
import { assertAiRequestAllowed, validateMeaningGenerateInput, validatePathshalaExplainInput } from '@/lib/ai/policies';
import { generateWithGemini } from '@/lib/ai/providers/gemini';
import { retrievePathshalaContext } from '@/lib/ai/retrieval';
import type {
  AIResponseMetadata,
  AITextResult,
  MeaningGenerateInput,
  PathshalaExplainInput,
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

  await retrievePathshalaContext({
    source: input.source,
    title: input.title,
    tradition: input.tradition,
  });

  const built = buildPathshalaExplainPrompt(input);
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
