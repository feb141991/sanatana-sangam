import { generateWithProvider } from '@/lib/ai/providers/inference';
import { emitEvent, emitError } from '@/lib/monitoring/events';
import {
  validatePipelineTags,
  getDefaultTags,
  mergeTags,
  logValidationResult,
  buildPipelinePromptHint,
} from '@/lib/ai/validate-pipeline-tags';

export interface PersonaliseSuggestion {
  suggestion: string;
  nudge: string | null;
  context_label: string;
  action?: {
    label: string;
    href: string;
    type: string;
  };
}

export const FALLBACK_SHLOKAS = [
  {
    text: 'योगः कर्मसु कौशलम्',
    source: 'Bhagavad Gita 2.50',
    meaning: 'Yoga is skill in action.',
    suggestion: 'Today, bring full attention to one task at a time. That is your practice.',
  },
  {
    text: 'तत् त्वम् असि',
    source: 'Chandogya Upanishad 6.8.7',
    meaning: 'That thou art — the infinite Self is your true nature.',
    suggestion: 'Sit quietly for five minutes and rest in the awareness that witnesses your thoughts.',
  },
  {
    text: 'अहिंसा परमो धर्मः',
    source: 'Mahabharata 13.117.37',
    meaning: 'Non-violence is the highest dharma.',
    suggestion: 'Notice any harsh self-talk today and replace it with compassion.',
  },
];

export const VALID_ACTION_HREFS = new Set([
  '/pathshala',
  '/bhakti',
  '/bhakti/mala',
  '/japa',
  '/bhakti/stotram',
  '/panchang',
  '/vrat',
  '/quiz',
]);

export interface GeneratePersonaliseInput {
  name?: string;
  tradition?: string | null;
  level?: string | null;
  seeking?: string | string[] | null;
  dayOfWeek: string;
  dateIso: string;
  routeContext?: string;
}

export async function generateDailyPersonalisation(
  input: GeneratePersonaliseInput,
): Promise<{ payload: PersonaliseSuggestion; source: 'ai' | 'fallback' }> {
  const {
    name = 'Seeker',
    tradition: rawTradition = 'general',
    level = 'beginner',
    dayOfWeek,
    dateIso,
    routeContext = '/api/home/personalise',
  } = input;

  const effectiveTradition = rawTradition ?? 'general';
  const tagValidation = validatePipelineTags(
    {
      tradition: effectiveTradition === 'general' ? 'generic' : effectiveTradition,
      content_type: 'instruction',
    },
    { context: 'personalise' },
  );
  logValidationResult(tagValidation, 'Personalise');

  const effectiveTags = mergeTags(
    tagValidation.tags,
    getDefaultTags({ contentType: 'instruction' }),
  );

  const tradition =
    effectiveTradition === 'general' && effectiveTags.tradition === 'generic'
      ? 'general'
      : effectiveTags.tradition ?? 'general';
  const pipelinePromptHint = buildPipelinePromptHint(effectiveTags);

  const seekingText = Array.isArray(input.seeking)
    ? input.seeking.join(', ')
    : (input.seeking ?? '');

  const prompt = `You are a warm, wise spiritual guide. Generate a personalised daily practice suggestion for ${name}.

USER PROFILE:
- Tradition: ${tradition}
- Spiritual level: ${level}
- Currently seeking: ${seekingText || 'general guidance'}
- Day: ${dayOfWeek}

Return ONLY this JSON (no markdown fences, no extra keys):
{
  "suggestion": "<A specific, actionable practice for today. 2-3 short sentences.>",
  "nudge": "<One short warm sentence of encouragement>",
  "context_label": "<A 2-4 word label for the day — e.g. 'Thursday Practice', 'Morning Sadhana'>",
  "action": {
    "label": "<Short CTA label, max 4 words>",
    "href": "<MUST be one of exactly: /pathshala, /bhakti, /bhakti/mala, /japa, /bhakti/stotram, /panchang, /vrat, /quiz>",
    "type": "primary"
  }
}

Keep the tone warm, grounded, and personal — not preachy. No shloka text needed.`;

  const startTime = Date.now();
  let raw = '';

  try {
    const result = await generateWithProvider(
      {
        system: [
          'You generate warm, structured JSON for personalized spiritual guidance.',
          pipelinePromptHint,
        ]
          .filter(Boolean)
          .join('\n\n'),
        user: prompt,
        temperature: 0.7,
        reasoningEffort: 'none',
        maxOutputTokens: 2048,
      },
      {
        responseFormat: 'json',
        providerOverride: 'sarvam-hosted',
      },
    );
    raw = result.text;

    emitEvent({
      severity: 'P3',
      domain: 'ai',
      route: routeContext,
      latency_ms: Date.now() - startTime,
      provider: result.provider,
      model: result.modelUsed,
      fallback_used: result.provider !== process.env.PRAMANA_INFERENCE_PROVIDER?.trim(),
      context: {
        feature: 'daily_personalise',
        tradition,
        level,
        pipeline_content_type: effectiveTags.content_type ?? null,
        pipeline_audio_mode: effectiveTags.audio_mode ?? null,
        pipeline_tradition: effectiveTags.tradition ?? null,
        pipeline_script: effectiveTags.script ?? null,
      },
    });
  } catch (err) {
    emitError('ai', err, 'P2', { route: routeContext, latency_ms: Date.now() - startTime });
    console.warn('[personalise] Provider generation failed, using fallback:', err);
  }

  const dayNum = parseInt(dateIso.split('-')[2] ?? '1', 10);
  const fallbackShloka = FALLBACK_SHLOKAS[dayNum % FALLBACK_SHLOKAS.length];
  const fallbackPayload: PersonaliseSuggestion = {
    suggestion: fallbackShloka.suggestion,
    nudge: null,
    context_label: "Today's practice",
    action: {
      label: 'Open Pathshala',
      href: '/pathshala',
      type: 'primary',
    },
  };

  if (!raw) {
    return { payload: fallbackPayload, source: 'fallback' };
  }

  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  let parsed: PersonaliseSuggestion | null = null;
  if (match) {
    try {
      parsed = JSON.parse(match[1]) as PersonaliseSuggestion;
    } catch {
      /* fall through */
    }
  }

  if (!parsed?.suggestion) {
    return { payload: fallbackPayload, source: 'fallback' };
  }

  if (parsed.action?.href && !VALID_ACTION_HREFS.has(parsed.action.href)) {
    parsed.action.href = '/pathshala';
  }

  return { payload: parsed, source: 'ai' };
}
