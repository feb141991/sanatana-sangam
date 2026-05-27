import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { localSpiritualDate } from '@/lib/sacred-time';
import { generateWithProvider } from '@/lib/ai/providers/inference';
import { emitEvent, emitError } from '@/lib/monitoring/events';
import { validatePipelineTags, getDefaultTags, mergeTags, logValidationResult, buildPipelinePromptHint } from '@/lib/ai/validate-pipeline-tags';

// GET /api/home/personalise
// Returns today's personalised shloka + practice suggestion for the authenticated user.
// Checks the recommendations cache first; generates via the active Pramana provider if stale.

// Curated fallback shlokas (tradition-neutral; used when Gemini is unavailable)
const FALLBACK_SHLOKAS = [
  {
    text:    'योगः कर्मसु कौशलम्',
    source:  'Bhagavad Gita 2.50',
    meaning: 'Yoga is skill in action.',
    suggestion: 'Today, bring full attention to one task at a time. That is your practice.',
  },
  {
    text:    'तत् त्वम् असि',
    source:  'Chandogya Upanishad 6.8.7',
    meaning: 'That thou art — the infinite Self is your true nature.',
    suggestion: 'Sit quietly for five minutes and rest in the awareness that witnesses your thoughts.',
  },
  {
    text:    'अहिंसा परमो धर्मः',
    source:  'Mahabharata 13.117.37',
    meaning: 'Non-violence is the highest dharma.',
    suggestion: 'Notice any harsh self-talk today and replace it with compassion.',
  },
];

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    // ── 0. Fetch timezone for spiritual date ─────────────────────────────────────
    const { data: tzRow } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .maybeSingle();

    // Spiritual day: starts at 4 AM local time, not midnight UTC
    const today = localSpiritualDate(tzRow?.timezone, 4);

    // ── 1. Check recommendations cache ──────────────────────────────────────────
    const { data: cached } = await supabase
      .from('recommendations')
      .select('content')
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('type', 'daily_content')
      .maybeSingle();

    if (cached?.content) {
      const c = cached.content as Record<string, unknown>;
      if (c?.suggestion) {
        return NextResponse.json({ ...c, from_cache: true });
      }
    }

    // ── 2. Fetch user profile ────────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('tradition, sampradaya, spiritual_level, seeking, full_name, username')
      .eq('id', user.id)
      .maybeSingle();

    // ── 3. Generate via active provider ──────────────────────────────────────────
    const rawTradition = profile?.tradition ?? 'general';
    const tagValidation = validatePipelineTags(
      {
        tradition: rawTradition === 'general' ? 'generic' : rawTradition,
        content_type: 'instruction',
      },
      { context: 'personalise' }
    );
    logValidationResult(tagValidation, 'Personalise');
    const effectiveTags = mergeTags(
      tagValidation.tags,
      getDefaultTags({ contentType: 'instruction' })
    );

    const tradition = (rawTradition === 'general' && effectiveTags.tradition === 'generic')
      ? 'general'
      : (effectiveTags.tradition ?? 'general');
    const pipelinePromptHint = buildPipelinePromptHint(effectiveTags);

    const level     = profile?.spiritual_level ?? 'beginner';
    const seeking   = (profile?.seeking as string[])?.join(', ') ?? '';
    const name      = profile?.full_name ?? profile?.username ?? 'Seeker';

    const dayOfWeek = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      timeZone: tzRow?.timezone ?? 'Asia/Kolkata',
    }).format(new Date());
    const startTime = Date.now();

    const prompt = `You are a warm, wise spiritual guide. Generate a personalised daily practice suggestion for ${name}.

USER PROFILE:
- Tradition: ${tradition}
- Spiritual level: ${level}
- Currently seeking: ${seeking || 'general guidance'}
- Day: ${dayOfWeek}

Return ONLY this JSON (no markdown fences, no extra keys):
{
  "suggestion": "<A specific, actionable practice for today. 2-3 short sentences.>",
  "nudge": "<One short warm sentence of encouragement>",
  "context_label": "<A 2-4 word label>",
  "action": {
    "label": "<Short CTA label>",
    "href": "<A valid internal route>",
    "type": "<'link' | 'primary'>"
  }
}

Keep the tone warm, grounded, and personal — not preachy. No shloka text needed.`;

    let raw = '';
    try {
      const result = await generateWithProvider(
        {
          system: [
            'You generate warm, structured JSON for personalized spiritual guidance.',
            pipelinePromptHint,
          ].filter(Boolean).join('\n\n'),
          user: prompt,
          temperature: 0.7,
          reasoningEffort: 'none',
          maxOutputTokens: 1200,
        },
        { 
          responseFormat: 'json',
          providerOverride: 'sarvam-hosted'
        }
      );
      raw = result.text;

      emitEvent({
        severity: 'P3',
        domain: 'ai',
        route: '/api/home/personalise',
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
      emitError('ai', err, 'P2', { route: '/api/home/personalise', latency_ms: Date.now() - startTime });
      console.warn('[personalise] Provider generation failed, falling back to curated local content:', err);
    }

    if (!raw) {
      const dayNum = parseInt(today.split('-')[2] ?? '1', 10);
      const fallback = FALLBACK_SHLOKAS[dayNum % FALLBACK_SHLOKAS.length];
      return NextResponse.json({ suggestion: fallback.suggestion, nudge: null, context_label: 'Today\'s practice', from_cache: false });
    }
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
    let parsed: Record<string, string | null> | null = null;
    if (match) {
      try { parsed = JSON.parse(match[1]); } catch { /* fall through */ }
    }

    if (!parsed?.suggestion) {
      const dayNum = parseInt(today.split('-')[2] ?? '1', 10);
      const fallback = FALLBACK_SHLOKAS[dayNum % FALLBACK_SHLOKAS.length];
      parsed = { suggestion: fallback.suggestion, nudge: null, context_label: 'Today\'s practice' };
    }

    // ── 4. Cache result ──────────────────────────────────────────────────────────
    await supabase.from('recommendations').upsert(
      { user_id: user.id, date: today, type: 'daily_content', content: parsed, generated_at: new Date().toISOString() },
      { onConflict: 'user_id,date,type' }
    ).then(({ error }) => { if (error) console.warn('[personalise] cache write failed:', error.message); });

    return NextResponse.json({ ...parsed, from_cache: false });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Personalise failed' }, { status: 500 });
  }
}
