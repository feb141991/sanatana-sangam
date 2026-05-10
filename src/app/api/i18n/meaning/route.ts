import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getLanguageInstruction, normalizeContentLanguage } from '@/lib/language-runtime';

const GEMINI_MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];

function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

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

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const entryId = typeof body?.entryId === 'string' ? body.entryId.trim() : '';
  const sourceMeaning = typeof body?.sourceMeaning === 'string' ? body.sourceMeaning.trim() : '';
  const sourceLabel = typeof body?.sourceLabel === 'string' ? body.sourceLabel.trim() : '';
  const targetLanguage = normalizeContentLanguage(body?.targetLanguage);

  if (!entryId || !sourceMeaning) {
    return NextResponse.json({ error: 'entryId and sourceMeaning are required' }, { status: 400 });
  }

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 });
  }

  const prompt = `Translate this sacred-text meaning for a devotional learning app.

Target language instruction: ${getLanguageInstruction(targetLanguage)}
Source label: ${sourceLabel}
Source meaning:
${sourceMeaning}

Rules:
- Translate the meaning, not the original verse.
- Keep it concise, natural, and respectful.
- Preserve doctrine and names accurately.
- Do not add new commentary.
- Return ONLY valid JSON:
{ "meaning": "<translated meaning>" }`;

  let raw = '';
  for (const model of GEMINI_MODELS) {
    const res = await fetch(`${geminiUrl(model)}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.25, maxOutputTokens: 500 },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      break;
    }

    if (res.status === 429 || res.status === 404) continue;
    return NextResponse.json({ error: `Gemini ${res.status}` }, { status: 502 });
  }

  const meaning = extractJsonMeaning(raw);
  if (!meaning) {
    return NextResponse.json({ error: 'Could not localize meaning' }, { status: 502 });
  }

  try {
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
  } catch {
    // Best-effort cache write only.
  }

  return NextResponse.json({ meaning, language: targetLanguage, status: 'generated' });
}
