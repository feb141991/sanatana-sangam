import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';
import { generateWithProvider } from '@/lib/ai/providers/inference';
import { emitEvent, emitError } from '@/lib/monitoring/events';

// ─── POST /api/admin/generate-hindi-meanings ──────────────────────────────────
// Accepts a batch of {id, meaning} pairs, translates via the active Pramana
// provider stack, and upserts results into the hindi_meanings table.
//
// Body: { entries: { id: string; meaning: string }[] }
// Returns: { saved: number; results: { id: string; meaning_hi: string }[] }
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const authError = await verifyAdminCookieAuth(req);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ('response' in admin) {
    return admin.response;
  }

  const body = await req.json().catch(() => null);
  const entries: { id: string; meaning: string }[] | null = 
    Array.isArray(body?.entries) ? body.entries : Array.isArray(body) ? body : null;

  if (!entries || entries.length === 0) {
    return NextResponse.json({ error: 'No entries provided or entries is not an array' }, { status: 400 });
  }

  const startTime = Date.now();

  const prompt = `You are translating scripture verse meanings to simple, natural Hindi (Devanagari script).
For each entry, provide a concise Hindi meaning (2-4 sentences). Preserve spiritual depth and accuracy.
Respond with ONLY a JSON array — no extra text, no markdown fences:
[{"id":"...","meaning_hi":"..."}]

Entries:
${JSON.stringify(entries.map((entry) => ({ id: entry.id, meaning_en: entry.meaning })), null, 2)}`;

  let rows: { entry_id: string; meaning_hi: string }[] = [];
  let provider = '';
  let model = '';

  try {
    const result = await generateWithProvider(
      {
        system: 'You translate spiritual explanations into simple, natural Hindi and return strict JSON only.',
        user: prompt,
        temperature: 0.2,
        reasoningEffort: 'none',
        maxOutputTokens: 4096,
      },
      { responseFormat: 'json' },
    );

    provider = result.provider ?? '';
    model = result.modelUsed ?? '';
    const cleaned = result.text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    let rawList: any[] = [];
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (parsed && typeof parsed === 'object') {
      // Handles LLM returning { results: [...] }, { entries: [...] }, { translations: [...] }, { data: [...] }
      const arrayKey = Object.keys(parsed).find((k) => Array.isArray(parsed[k]));
      if (arrayKey) {
        rawList = parsed[arrayKey];
      } else if (parsed.id && (parsed.meaning_hi || parsed.hindi || parsed.meaning)) {
        rawList = [parsed];
      }
    }

    if (!Array.isArray(rawList) || rawList.length === 0) {
      throw new Error(`AI model returned a non-array response: ${cleaned.slice(0, 120)}`);
    }

    rows = rawList
      .filter((entry) => entry && typeof entry === 'object' && (entry.id || entry.entry_id))
      .map((entry) => ({
        entry_id: String(entry.id || entry.entry_id),
        meaning_hi: String(entry.meaning_hi || entry.hindi || entry.meaning || entry.text || '').trim(),
      }))
      .filter((row) => row.meaning_hi.length > 0);

    if (rows.length === 0) {
      throw new Error('No valid translated rows could be extracted from provider output');
    }
  } catch (err: any) {
    emitError('ai', err, 'P2', { route: '/api/admin/generate-hindi-meanings', latency_ms: Date.now() - startTime });
    return NextResponse.json(
      { error: `Failed to generate or parse provider response: ${err.message || String(err)}` },
      { status: 500 }
    );
  }

  const { error: upsertErr } = await admin.supabase
    .from('hindi_meanings')
    .upsert(rows, { onConflict: 'entry_id' });

  if (upsertErr) {
    emitError('ai', upsertErr, 'P2', { route: '/api/admin/generate-hindi-meanings', latency_ms: Date.now() - startTime });
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  emitEvent({
    severity: 'P3',
    domain: 'ai',
    route: '/api/admin/generate-hindi-meanings',
    latency_ms: Date.now() - startTime,
    provider,
    model,
    fallback_used: provider !== process.env.PRAMANA_INFERENCE_PROVIDER?.trim(),
    context: {
      feature: 'generate_hindi_meanings',
      batch_size: entries.length,
    },
  });

  return NextResponse.json({
    saved: rows.length,
    results: rows.map((r) => ({ id: r.entry_id, meaning_hi: r.meaning_hi })),
  });
}
