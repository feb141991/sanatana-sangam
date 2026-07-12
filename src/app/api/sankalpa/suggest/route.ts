import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { assertNotBanned } from '@/lib/api-guards';
import { generateWithProvider } from '@/lib/ai/providers/inference';
import {
  pickFallbackSuggestions,
  type SankalpaSuggestionPractice,
} from '@/lib/sankalpa-suggestions';

// GET /api/sankalpa/suggest — up to 4 suggested Sankalpa resolutions.
//
// Contract: this endpoint ALWAYS returns 200 with exactly `count` usable
// suggestion strings. AI personalization (tradition + most-practiced area,
// via the shared Pramana inference provider already used by
// festival-verify.ts and dharm-veer-generation.ts) is an enhancement layered
// on top of the static SANKALPA_SUGGESTIONS bank, never a dependency of it.
// If the AI call is slow, errors, or returns something unparseable, the
// route silently falls back to the static bank and reports
// `source: 'fallback'` — the create-Sankalpa flow never has to special-case
// failure differently from success.

const SUGGESTION_COUNT = 4;
const AI_TIMEOUT_MS = 7000;

const PRACTICE_COLUMNS: Record<Exclude<SankalpaSuggestionPractice, 'all'>, string> = {
  japa: 'japa_done',
  nitya: 'nitya_done',
  pathshala: 'pathshala_done',
  quiz: 'quiz_done',
};

function extractJsonArray(text: string): unknown[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI suggest timeout')), ms)),
  ]);
}

export async function GET(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (!user || !supabase) {
    return NextResponse.json({ error: authError?.message ?? 'Unauthorized' }, { status: 401 });
  }
  const banned = await assertNotBanned(supabase, user.id);
  if (banned) return banned;

  // ── Context gathering (best-effort; never blocks the response) ─────────
  let tradition = 'hindu';
  let topPractice: SankalpaSuggestionPractice | null = null;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tradition')
      .eq('id', user.id)
      .single();
    if (profile?.tradition) tradition = profile.tradition;
  } catch {
    // profile lookup is best-effort; default tradition stands
  }

  try {
    const since = new Date();
    since.setDate(since.getDate() - 21);
    const { data: recentSadhana } = await supabase
      .from('daily_sadhana')
      .select('japa_done, nitya_done, pathshala_done, quiz_done')
      .eq('user_id', user.id)
      .gte('date', since.toISOString().slice(0, 10));

    if (recentSadhana && recentSadhana.length > 0) {
      const counts: Record<string, number> = { japa: 0, nitya: 0, pathshala: 0, quiz: 0 };
      for (const row of recentSadhana) {
        for (const [practice, column] of Object.entries(PRACTICE_COLUMNS)) {
          if ((row as Record<string, boolean>)[column]) counts[practice] += 1;
        }
      }
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (top && top[1] > 0) topPractice = top[0] as SankalpaSuggestionPractice;
    }
  } catch {
    // activity lookup is best-effort; topPractice stays null
  }

  const fallback = pickFallbackSuggestions(topPractice, SUGGESTION_COUNT);

  // ── AI personalization attempt ──────────────────────────────────────────
  try {
    const practiceLabel = topPractice ?? 'a well-rounded daily practice';
    const prompt = `A devotee following the ${tradition} tradition is about to set a Sankalpa (a sacred, time-bound personal vow held for a fixed number of days). Their most active practice recently has been: ${practiceLabel}.

Suggest exactly ${SUGGESTION_COUNT} short Sankalpa resolutions they could take. Each must:
- Be a first-person vow starting with "I will..."
- Be between 10 and 140 characters
- Be concrete and specific enough to check in on daily, not vague
- Draw naturally from their tradition and recent practice, without being repetitive across the ${SUGGESTION_COUNT} options

Return ONLY a JSON array of ${SUGGESTION_COUNT} strings, nothing else.`;

    const result = await withTimeout(
      generateWithProvider(
        { user: prompt, temperature: 0.65, reasoningEffort: 'none', maxOutputTokens: 1024 },
        { responseFormat: 'json' },
      ),
      AI_TIMEOUT_MS,
    );

    const parsed = extractJsonArray(result.text)
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length >= 10 && item.length <= 200);

    if (parsed.length >= SUGGESTION_COUNT) {
      return NextResponse.json(
        { suggestions: parsed.slice(0, SUGGESTION_COUNT), source: 'ai' },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    // Partial/short AI result — top up with fallback entries rather than
    // discarding the (still valid) AI suggestions we did get.
    if (parsed.length > 0) {
      const topped = [...parsed, ...fallback].slice(0, SUGGESTION_COUNT);
      return NextResponse.json(
        { suggestions: topped, source: 'ai' },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    throw new Error('AI returned no usable suggestions');
  } catch (err) {
    console.warn('[sankalpa/suggest/GET] AI personalization unavailable, using fallback:', err);
    return NextResponse.json(
      { suggestions: fallback, source: 'fallback' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
