import { buildMeaningGeneratePrompt, buildPathshalaExplainPrompt } from '@/lib/ai/context-builder';
import { assertAiRequestAllowed, validateMeaningGenerateInput, validatePathshalaExplainInput, validateAIChatInput } from '@/lib/ai/policies';
import { generateWithGemini } from '@/lib/ai/providers/gemini';
import { retrievePathshalaContext } from '@/lib/ai/retrieval';
import { GeminiModelAdapter } from '@sangam/pramana-serve';
import { DharmaChatContract, createPramanaRoute } from '@sangam/pramana-core';
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

  const runner = createPramanaRoute(DharmaChatContract, {
    adapter,
    policies: [
      {
        name: 'ai_request_allowed',
        evaluate(inp) {
          assertAiRequestAllowed({
            task: 'ai_chat',
            tradition: inp.tradition,
            language: inp.language,
            scope: ['user_preference_only'],
          });
        }
      },
      {
        name: 'validate_input',
        evaluate(inp) {
          validateAIChatInput(inp);
        }
      }
    ]
  });

  const res = await runner(input);
  return {
    raw: res.raw,
    metadata: {
      task: 'ai_chat',
      provider: res.metadata.provider,
      model: res.metadata.model,
      privateStackReady: res.metadata.privateStackReady,
      usedHostedFallback: res.metadata.usedHostedFallback,
    }
  };
}
