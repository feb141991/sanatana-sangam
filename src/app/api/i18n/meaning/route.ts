import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { normalizeMeaningTargetLanguage } from '@/lib/ai/context-builder';
import { runMeaningGenerate } from '@/lib/ai/router';
import { generateSarvamTranslation } from '@/lib/ai/providers/sarvam-translate';
import { emitEvent, emitError } from '@/lib/monitoring/events';
import { generateReasoningCacheKey, fetchReasoningCache, storeReasoningCache } from '@/lib/ai/reasoning-cache';
import { getDefaultTags, logValidationResult, mergeTags, validatePipelineTags } from '@/lib/ai/validate-pipeline-tags';

function stableHash(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return String(hash);
}

function extractJsonMeaning(raw: string) {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) return '';
  try {
    const parsed = JSON.parse(jsonMatch[1]);
    return typeof parsed?.meaning === 'string' ? parsed.meaning.trim() : '';
  } catch {
    return '';
  }
}

function mapToSarvamLangCode(lang: string): string {
  const map: Record<string, string> = {
    'hi': 'hi-IN',
    'ta': 'ta-IN',
    'te': 'te-IN',
    'mr': 'mr-IN',
    'gu': 'gu-IN',
    'kn': 'kn-IN',
    'ml': 'ml-IN',
    'pa': 'pa-IN',
    'bn': 'bn-IN',
    'or': 'or-IN',
  };
  return map[lang] || 'hi-IN';
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const entryId = typeof body?.entryId === 'string' ? body.entryId.trim() : '';
  const sourceMeaning = typeof body?.sourceMeaning === 'string' ? body.sourceMeaning.trim() : '';
  const sourceLabel = typeof body?.sourceLabel === 'string' ? body.sourceLabel.trim() : '';
  const targetLanguage = normalizeMeaningTargetLanguage(body?.targetLanguage);
  const tagValidation = validatePipelineTags(body?.pipelineTags ?? body?.tags, { context: 'meaning_request' });
  logValidationResult(tagValidation, 'Meaning');
  const effectiveTags = mergeTags(
    tagValidation.tags,
    getDefaultTags({ text: sourceMeaning || sourceLabel, contentType: 'scripture' }),
  );

  if (targetLanguage === 'en') {
    return NextResponse.json({ meaning: sourceMeaning, language: 'en', status: 'fallback' });
  }

  const supabase = await createServerSupabaseClient();

  try {
    const { data } = await supabase
      .from('content_meanings')
      .select('meaning')
      .eq('entry_id', entryId)
      .eq('language', targetLanguage)
      .maybeSingle();

    if (typeof data?.meaning === 'string' && data.meaning.trim()) {
      emitEvent({ severity: 'P3', domain: 'translation', route: '/api/i18n/meaning', context: { status: 'cached' } });
      return NextResponse.json({ meaning: data.meaning, language: targetLanguage, status: 'cached' });
    }
  } catch {
    // The migration may not be applied in older environments. Generation still works.
  }

  const startTime = Date.now();

  try {
    // Check reasoning cache first (before generating new meaning)
    const cacheKey = generateReasoningCacheKey('meaning_generate', {
      entryId,
      sourceMeaning,
      sourceLabel,
      targetLanguage,
    });
    const reasoningCached = await fetchReasoningCache('meaning_generate', cacheKey);
    if (reasoningCached && reasoningCached.meaning) {
      emitEvent({
        severity: 'P3',
        domain: 'translation',
        route: '/api/i18n/meaning',
        context: {
          status: 'reasoning_cached',
          latency_ms: Date.now() - startTime,
          content_type: effectiveTags.content_type ?? null,
          tradition: effectiveTags.tradition ?? null,
        }
      });
      return NextResponse.json({
        meaning: reasoningCached.meaning,
        language: targetLanguage,
        status: 'reasoning_cached',
        ai: reasoningCached.aiMetadata
      });
    }

    let meaning = '';
    let aiMetadata = undefined;
    const sarvamKey = process.env.SARVAM_API_KEY?.trim();

    if (sarvamKey) {
      try {
        const textToTranslate = sourceMeaning || sourceLabel || entryId;
        const translated = await generateSarvamTranslation(sarvamKey, {
          input: textToTranslate,
          source_language_code: 'en-IN',
          target_language_code: mapToSarvamLangCode(targetLanguage),
        });
        meaning = translated.trim();
        aiMetadata = { task: 'meaning_generate', provider: 'sarvam-translate', model: 'sarvam-translate:v1', privateStackReady: false, usedHostedFallback: false };
      } catch (err) {
        console.error('Sarvam translate failed, falling back to inference provider:', err);
      }
    }

    if (!meaning) {
      const result = await runMeaningGenerate({
        entryId,
        sourceMeaning,
        sourceLabel,
        targetLanguage,
      });
      meaning = extractJsonMeaning(result.raw);
      aiMetadata = result.metadata;
    }

    if (!meaning) {
      return NextResponse.json({ error: 'Could not localize meaning' }, { status: 502 });
    }

    // Store to reasoning cache (non-blocking)
    storeReasoningCache('meaning_generate', cacheKey, { meaning, aiMetadata }).catch((e: unknown) => {
      console.warn('[i18n/meaning] reasoning cache write failed:', (e as Error)?.message);
    });

    await supabase
      .from('content_meanings')
      .upsert({
        entry_id: entryId,
        language: targetLanguage,
        meaning,
        source_label: sourceLabel || null,
        source_meaning_hash: stableHash(sourceMeaning),
        source_status: 'ai_generated',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'entry_id,language' });

    emitEvent({
      severity: 'P3',
      domain: 'translation',
      route: '/api/i18n/meaning',
      latency_ms: Date.now() - startTime,
      provider: aiMetadata?.provider,
      model: aiMetadata?.model,
      fallback_used: aiMetadata?.usedHostedFallback,
      context: {
        content_type: effectiveTags.content_type ?? null,
        tradition: effectiveTags.tradition ?? null,
      }
    });

    return NextResponse.json({ meaning, language: targetLanguage, status: 'generated', ai: aiMetadata });
  } catch (err: any) {
    emitError('translation', err, 'P2', { route: '/api/i18n/meaning' });
    const msg = err?.message ?? 'Could not localize meaning';
    const status = String(msg).includes('required') ? 400 : String(msg).includes('configured') ? 503 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
