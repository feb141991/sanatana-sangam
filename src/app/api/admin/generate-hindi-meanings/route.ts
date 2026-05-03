import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── POST /api/admin/generate-hindi-meanings ──────────────────────────────────
// Accepts a batch of {id, meaning} pairs, translates via Gemini flash-lite,
// upserts results into the hindi_meanings table.
//
// Body: { entries: { id: string; meaning: string }[] }
// Returns: { saved: number; results: { id: string; meaning_hi: string }[] }
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_API_KEY    = process.env.GEMINI_API_KEY;
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  // Simple admin guard — same pattern as other admin routes
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret) {
    const auth = req.headers.get('x-admin-secret');
    if (auth !== adminSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  const { entries } = await req.json() as { entries: { id: string; meaning: string }[] };
  if (!entries?.length) {
    return NextResponse.json({ error: 'No entries provided' }, { status: 400 });
  }

  // ── Translate via Gemini ──────────────────────────────────────────────────
  const prompt = `You are translating scripture verse meanings to simple, natural Hindi (Devanagari script).
For each entry, provide a concise Hindi meaning (2-4 sentences). Preserve spiritual depth and accuracy.
Respond with ONLY a JSON array — no extra text, no markdown fences:
[{"id":"...","meaning_hi":"..."}]

Entries:
${JSON.stringify(entries.map(e => ({ id: e.id, meaning_en: e.meaning })), null, 2)}`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
      }),
    }
  );

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    return NextResponse.json({ error: `Gemini error: ${errText}` }, { status: 500 });
  }

  const geminiData = await geminiRes.json();
  const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();

  let results: { id: string; meaning_hi: string }[];
  try {
    results = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: 'Failed to parse Gemini response', raw: rawText }, { status: 500 });
  }

  // ── Upsert into Supabase ──────────────────────────────────────────────────
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const rows = results.map(r => ({ entry_id: r.id, meaning_hi: r.meaning_hi }));

  const { error: upsertErr } = await supabase
    .from('hindi_meanings')
    .upsert(rows, { onConflict: 'entry_id' });

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  return NextResponse.json({ saved: rows.length, results });
}
