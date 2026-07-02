import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { runPathshalaExplain } from '@/lib/ai/router';
import { emitEvent, emitError } from '@/lib/monitoring/events';
import { validatePipelineTags, getDefaultTags, mergeTags, canExplain, logValidationResult } from '@/lib/ai/validate-pipeline-tags';

function extractExplanation(raw: string) {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[1]) as Record<string, string>;
  } catch {
    return null;
  }
}

function buildFallbackExplanation(input: {
  translation?: string;
  originalText?: string;
  transliteration?: string;
  source?: string;
  title?: string;
  tradition?: string;
}) {
  const baseMeaning = input.translation?.trim()
    || input.originalText?.trim()
    || input.transliteration?.trim()
    || 'This verse is available for reflection, but a richer explanation could not be generated right now.';

  const sourceLabel = [input.source, input.title].filter(Boolean).join(' — ');
  const traditionLabel = input.tradition ? `${input.tradition} tradition` : 'this tradition';

  return {
    word_by_word: input.transliteration?.trim()
      ? `Key terms can be read through the transliteration: ${input.transliteration.trim().slice(0, 180)}${input.transliteration.trim().length > 180 ? '…' : ''}`
      : 'A word-by-word breakdown is unavailable right now.',
    meaning: baseMeaning,
    commentary: sourceLabel
      ? `This teaching from ${sourceLabel} should be read in the context of the ${traditionLabel}. Focus first on the plain meaning, then return to the verse again for deeper reflection.`
      : `This teaching should be read in the context of the ${traditionLabel}. Focus first on the plain meaning, then return to the verse again for deeper reflection.`,
    daily_application: 'Carry one line of this teaching into the day and use it to steady one decision, reaction, or conversation.',
    contemplation: 'What in this verse applies directly to the state of your mind today?',
    related_text: input.source || 'Return to this same passage after practice for a deeper reading.',
  };
}

export async function POST(req: Request) {
  // ── Auth + pro gate ─────────────────────────────────────────────────────────
  // AI explanation is a Zenith (Pro) feature — free users fall back to the
  // static meaning/translation already rendered in the reader.
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile?.is_pro) {
    return NextResponse.json(
      { error: 'Upgrade to Zenith to unlock AI verse explanations.', upgrade_required: true },
      { status: 403 },
    );
  }

  const {
    sanskrit,
    originalText,
    transliteration,
    translation,
    source,
    title,
    tradition,
    language = 'en',
    responseMode,
    pipelineTags,
    tags,
  } = await req.json().catch(() => ({}));

  const startTime = Date.now();
  try {
    // Validate and normalize incoming pipeline tags
    const tagValidation = validatePipelineTags(pipelineTags ?? tags, { context: 'explain_request' });
    logValidationResult(tagValidation, 'Explain');
    const providedTags = tagValidation.tags;

    // Merge with defaults
    const defaultTags = getDefaultTags({ text: originalText ?? sanskrit });
    const effectiveTags = mergeTags(providedTags, defaultTags);

    // Check if explain is allowed for this content_type
    if (!canExplain(effectiveTags.content_type)) {
      return NextResponse.json(
        { error: `Explain not allowed for content_type: ${effectiveTags.content_type}` },
        { status: 400 }
      );
    }

    const result = await runPathshalaExplain({
      sanskrit,
      originalText,
      transliteration,
      translation,
      source,
      title,
      tradition,
      language,
      responseMode,
    });

    let explanation = extractExplanation(result.raw);
    if (!explanation) {
      explanation = {
        word_by_word:      '',
        meaning:           translation ?? '',
        commentary:        '',
        daily_application: 'Reflect on this verse during your practice today.',
        contemplation:     'How does this teaching speak to your life right now?',
        related_text:      '',
      };
    }

    emitEvent({
      severity: 'P3',
      domain: 'ai',
      route: '/api/pathshala/explain',
      latency_ms: Date.now() - startTime,
      provider: result.metadata?.provider,
      model: result.metadata?.model,
      context: {
        fallback_used: result.metadata?.usedHostedFallback ?? false,
        cached: result._cached === true,
        content_type: effectiveTags.content_type ?? 'unknown',
        response_mode: responseMode ?? 'unknown',
        tradition: tradition ?? 'unknown'
      }
    });

    return NextResponse.json({
      explanation,
      tradition: result.school,
      teacher:   result.teacher,
      source,
      title,
      ai: result.metadata,
    });
  } catch (err: any) {
    emitError('ai', err, 'P2', { route: '/api/pathshala/explain', latency_ms: Date.now() - startTime });
    const msg = err?.message ?? 'Explain failed';

    if (translation || originalText || transliteration) {
      return NextResponse.json({
        explanation: buildFallbackExplanation({
          translation,
          originalText,
          transliteration,
          source,
          title,
          tradition,
        }),
        tradition: tradition ?? 'fallback',
        teacher: 'Shoonaya',
        source,
        title,
        is_fallback: true,
        ai: {
          provider: 'fallback',
          degraded: true,
          warning: msg,
        },
      });
    }

    const status = String(msg).includes('required') ? 400 : String(msg).includes('configured') ? 503 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
