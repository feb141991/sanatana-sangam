import { buildMeaningGeneratePrompt, buildPathshalaExplainPrompt, buildDevotionalStoryExplainPrompt, buildMoralStoryExplainPrompt, buildUpanishadsExplainPrompt, buildGurbaniShabadExplainPrompt, buildBuddhistSutraExplainPrompt, buildJainSutraExplainPrompt } from '@/lib/ai/context-builder';
import { assertAiRequestAllowed, validateMeaningGenerateInput, validatePathshalaExplainInput, validateAIChatInput } from '@/lib/ai/policies';
import { generateWithProvider, getInferenceProvider } from '@/lib/ai/providers/inference';
import { retrievePathshalaContext } from '@/lib/ai/retrieval';
import { withReasoningCache } from '@/lib/ai/reasoning-cache';
import { SimpleCorpusSelector } from '@sangam/pramana-serve';
import { DharmaChatContract, createPramanaRoute } from '@sangam/pramana-core';
import { getLanguageInstruction } from '@/lib/language-runtime';
import type {
  AIResponseMetadata,
  AITextResult,
  MeaningGenerateInput,
  PathshalaExplainInput,
  AIChatInput,
} from '@/lib/ai/contracts';

function buildMetadata(task: AIResponseMetadata['task'], result: AITextResult): AIResponseMetadata & { requestedProvider?: string; actualProvider?: string; fallbackOccurred?: boolean } {
  const primaryProvider = getInferenceProvider();
  const requestedProvider = primaryProvider.info.id;
  const actualProvider = result.provider;
  const fallbackOccurred = requestedProvider !== actualProvider;

  return {
    task,
    provider: result.provider,
    model: result.modelUsed,
    privateStackReady: primaryProvider.info.providerClass === 'self_hosted',
    usedHostedFallback: fallbackOccurred || primaryProvider.info.providerClass === 'hosted',
    requestedProvider,
    actualProvider,
    fallbackOccurred
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

  // Try persistent cache first
  const cached = await withReasoningCache('pathshala_explain', input, async () => {
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
          : input.responseMode === 'buddhist_sutra_explain'
          ? 'buddhist_dhamma'
          : input.responseMode === 'jain_sutra_explain'
          ? 'jain_dharma'
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
    } else if (corpusId === 'buddhist_dhamma' || input.responseMode === 'buddhist_sutra_explain') {
      built = buildBuddhistSutraExplainPrompt({
        ...input,
        retrievedChunks: chunks,
      });
    } else if (corpusId === 'jain_dharma' || input.responseMode === 'jain_sutra_explain') {
      built = buildJainSutraExplainPrompt({
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

    const result = await generateWithProvider(built.prompt, {
      responseFormat: 'json',
      maxOutputTokens: 4096,
    });

    return {
      raw: result.text,
      teacher: built.teacher,
      school: built.school,
      metadata: buildMetadata('pathshala_explain', result),
    };
  });

  return cached;
}

export async function runMeaningGenerate(input: MeaningGenerateInput) {
  assertAiRequestAllowed({
    task: 'meaning_generate',
    language: input.targetLanguage,
    scope: ['public_corpus'],
  });
  validateMeaningGenerateInput(input);

  return withReasoningCache('meaning_generate', input, async () => {
    const prompt = buildMeaningGeneratePrompt(input);
    const result = await generateWithProvider(prompt);

    return {
      raw: result.text,
      metadata: buildMetadata('meaning_generate', result),
    };
  });
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
  const primaryProviderInfo = getInferenceProvider().info;
  const requestedProvider = primaryProviderInfo.id;
  const actualProvider = res.metadata.provider;
  const fallbackOccurred = requestedProvider !== actualProvider;
  
  return {
    raw: res.raw,
    metadata: {
      task: 'ai_chat',
      provider: res.metadata.provider,
      model: res.metadata.model,
      privateStackReady: primaryProviderInfo.providerClass === 'self_hosted',
      usedHostedFallback: fallbackOccurred || primaryProviderInfo.providerClass === 'hosted',
      requestedProvider,
      actualProvider,
      fallbackOccurred
    }
  };
}

export async function runPathshalaBridge(input: { lessonTitle: string; pathTitle: string; tradition: string; language: string; lastEntryMeaning?: string; completedCount: number; totalLessons: number; }) {
  assertAiRequestAllowed({
    task: 'pathshala_explain', // we use explain privileges for bridging
    tradition: input.tradition,
    language: input.language,
    scope: ['user_preference_only'],
  });

  return withReasoningCache('pathshala_bridge', input, async () => {
    const langInstruction = getLanguageInstruction(input.language);
    
    const system = `You are a warm, wise guide in the ${input.tradition} tradition.`;
    let userPrompt = `The user just completed a lesson titled "${input.lessonTitle}" in the path "${input.pathTitle}".\nThis was lesson ${input.completedCount} out of ${input.totalLessons}.\n`;
    if (input.lastEntryMeaning) {
      userPrompt += `The final verse they read meant: "${input.lastEntryMeaning}"\n`;
    }
    userPrompt += `\nTask:\nWrite a 2-sentence post-lesson reflection bridge. Return exactly JSON.\n`;
    userPrompt += `1. "bridge": One sentence connecting this lesson to the user's day.\n`;
    userPrompt += `2. "next_step": One sentence pointing gently to what comes next in the path. (If ${input.completedCount} == ${input.totalLessons}, tell them they have completed the path and should sit with it).\n\n`;
    userPrompt += `${langInstruction}\n\n`;
    userPrompt += `Output strictly JSON with keys "bridge" and "next_step".`;

    const result = await generateWithProvider({ system, user: userPrompt }, {
      responseFormat: 'json',
      maxOutputTokens: 1024,
    });

    return {
      raw: result.text,
      metadata: buildMetadata('pathshala_explain', result),
    };
  });
}

export async function runPathshalaRecommend(input: { tradition: string; completedPathIds: string[]; currentMood?: string; language: string; pathTitle: string; }) {
  assertAiRequestAllowed({
    task: 'pathshala_explain',
    tradition: input.tradition,
    language: input.language,
    scope: ['user_preference_only'],
  });

  return withReasoningCache('pathshala_recommend', input, async () => {
    const langInstruction = getLanguageInstruction(input.language);
    
    const system = `You are a warm, wise guide in the ${input.tradition} tradition.`;
    let userPrompt = `We are recommending the path "${input.pathTitle}" to the user.\n`;
    if (input.currentMood) {
      userPrompt += `The user's current mood or state is: ${input.currentMood}.\n`;
    }
    userPrompt += `\nTask:\nWrite a ONE sentence reason explaining why this path suits this person right now. Return exactly JSON.\n`;
    userPrompt += `1. "reason": The one sentence explanation.\n\n`;
    userPrompt += `${langInstruction}\n\n`;
    userPrompt += `Output strictly JSON with key "reason".`;

    const result = await generateWithProvider({ system, user: userPrompt }, {
      responseFormat: 'json',
      maxOutputTokens: 512,
    });

    return {
      raw: result.text,
      metadata: buildMetadata('pathshala_explain', result),
    };
  });
}
