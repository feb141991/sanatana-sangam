import { NextResponse } from 'next/server';
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

export async function POST(req: Request) {
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
    const status = String(msg).includes('required') ? 400 : String(msg).includes('configured') ? 503 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
