import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { normalizeMeaningTargetLanguage } from '@/lib/ai/context-builder';
import { runMeaningGenerate } from '@/lib/ai/router';
import { generateSarvamTranslation } from '@/lib/ai/providers/sarvam-translate';

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
      return NextResponse.json({ meaning: data.meaning, language: targetLanguage, status: 'cached' });
    }
  } catch {
    // The migration may not be applied in older environments. Generation still works.
  }

  try {
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
        aiMetadata = { task: 'meaning_generate', provider: 'sarvam-translate', model: 'sarvam-1', privateStackReady: false, usedHostedFallback: false };
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
    return NextResponse.json({ meaning, language: targetLanguage, status: 'generated', ai: aiMetadata });
  } catch (err: any) {
    const msg = err?.message ?? 'Could not localize meaning';
    const status = String(msg).includes('required') ? 400 : String(msg).includes('configured') ? 503 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
