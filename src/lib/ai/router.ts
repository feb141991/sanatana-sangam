import { buildMeaningGeneratePrompt, buildPathshalaExplainPrompt, buildDevotionalStoryExplainPrompt, buildMoralStoryExplainPrompt, buildUpanishadsExplainPrompt, buildGurbaniShabadExplainPrompt } from '@/lib/ai/context-builder';
import { assertAiRequestAllowed, validateMeaningGenerateInput, validatePathshalaExplainInput, validateAIChatInput } from '@/lib/ai/policies';
import { generateWithProvider, getInferenceProvider } from '@/lib/ai/providers/inference';
import { retrievePathshalaContext } from '@/lib/ai/retrieval';
import { SimpleCorpusSelector } from '@sangam/pramana-serve';
import { DharmaChatContract, createPramanaRoute } from '@sangam/pramana-core';
import type {
  AIResponseMetadata,
  AITextResult,
  MeaningGenerateInput,
  PathshalaExplainInput,
  AIChatInput,
} from '@/lib/ai/contracts';

function buildMetadata(task: AIResponseMetadata['task'], result: AITextResult): AIResponseMetadata {
  const provider = getInferenceProvider();
  return {
    task,
    provider: result.provider,
    model: result.modelUsed,
    privateStackReady: provider.info.providerClass === 'self_hosted',
    usedHostedFallback: provider.info.providerClass === 'hosted',
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

  const selector = new SimpleCorpusSelector();
  const corpusId = selector.selectCorpus(
    `${input.title ?? ''} ${input.source ?? ''}`.trim(),
    {
      source: input.source || null,
      title: input.title || null,
      tradition: input.tradition || null,
      corpus: input.responseMode === 'devotional_story_explain'
        ? 'bhakti_katha'
        : input.responseMode === 'moral_story_explain'
        ? 'bhakti_panchatantra'
        : input.responseMode === 'scripture_passage_explain'
        ? 'pathshala_upanishads'
        : input.responseMode === 'gurbani_shabad_explain'
        ? 'sikh_gurbani'
        : null,
    }
  );

  const chunks = await retrievePathshalaContext({
    source: input.source,
    title: input.title,
    tradition: input.tradition,
    corpus: corpusId,
  });

  let built;
  if (corpusId === 'pathshala_upanishads' || input.responseMode === 'scripture_passage_explain') {
    built = buildUpanishadsExplainPrompt({
      ...input,
      retrievedChunks: chunks,
    });
  } else if (corpusId === 'sikh_gurbani' || input.responseMode === 'gurbani_shabad_explain') {
    built = buildGurbaniShabadExplainPrompt({
      ...input,
      retrievedChunks: chunks,
    });
  } else if (corpusId === 'bhakti_panchatantra' || input.responseMode === 'moral_story_explain') {
    built = buildMoralStoryExplainPrompt({
      ...input,
      retrievedChunks: chunks,
    });
  } else if (corpusId === 'bhakti_katha' || input.responseMode === 'devotional_story_explain') {
    built = buildDevotionalStoryExplainPrompt({
      ...input,
      retrievedChunks: chunks,
    });
  } else {
    built = buildPathshalaExplainPrompt({
      ...input,
      retrievedChunks: chunks,
    });
  }

  const result = await generateWithProvider(built.prompt);

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
  const result = await generateWithProvider(prompt);

  return {
    raw: result.text,
    metadata: buildMetadata('meaning_generate', result),
  };
}

export async function runDharmaChat(input: AIChatInput) {
  const runner = createPramanaRoute(DharmaChatContract, {
    adapter: {
      generate: async (prompt) => generateWithProvider(prompt)
    },
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
  const providerInfo = getInferenceProvider().info;
  
  return {
    raw: res.raw,
    metadata: {
      task: 'ai_chat',
      provider: res.metadata.provider,
      model: res.metadata.model,
      privateStackReady: providerInfo.providerClass === 'self_hosted',
      usedHostedFallback: providerInfo.providerClass === 'hosted',
    }
  };
}
