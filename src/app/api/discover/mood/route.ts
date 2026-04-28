import { NextResponse } from 'next/server';
import { ALL_LIBRARY_ENTRIES } from '@/lib/library-content';

// POST /api/discover/mood
// Body: { mood: string, tradition?: string }
// Returns up to 6 curated verses matching the mood via keyword scoring.
// Optional Gemini re-ranking/commentary if API key is set.
//
// Uses gemini-2.0-flash-lite (30 RPM free tier) with fallback to gemini-2.0-flash.
// Results are cached in-memory for 1 hour per mood+tradition to reduce quota pressure.

function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}
const GEMINI_MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];

// ── Simple 1-hour in-memory cache (keyed by mood:tradition) ──────────────────
// Not shared across Vercel cold starts, but dramatically reduces calls within
// a warm function instance when users tap multiple moods in a session.
type LibraryEntry = (typeof ALL_LIBRARY_ENTRIES)[number];
interface CacheEntry { insights: string[]; top6: LibraryEntry[]; ts: number }
const _moodCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ── Mood → keyword seeds ──────────────────────────────────────────────────────
const MOOD_SEEDS: Record<string, string[]> = {
  anxious:     ['fear', 'worry', 'peace', 'calm', 'steady', 'equanimity', 'freedom', 'courage', 'surrender', 'trust'],
  grieving:    ['grief', 'sorrow', 'loss', 'impermanence', 'death', 'rebirth', 'soul', 'eternal', 'consolation', 'peace'],
  angry:       ['anger', 'desire', 'attachment', 'ego', 'control', 'let go', 'patience', 'forgiveness', 'compassion'],
  scattered:   ['focus', 'mind', 'attention', 'concentration', 'practice', 'discipline', 'steady', 'meditation', 'clarity'],
  lost:        ['path', 'dharma', 'purpose', 'duty', 'direction', 'guidance', 'teacher', 'light', 'truth', 'wisdom'],
  joyful:      ['joy', 'bliss', 'gratitude', 'celebration', 'abundance', 'love', 'devotion', 'beauty', 'delight'],
  seeking:     ['truth', 'knowledge', 'liberation', 'self', 'brahman', 'atman', 'understanding', 'inquiry', 'wisdom'],
  lonely:      ['connection', 'love', 'sangha', 'community', 'divine', 'presence', 'within', 'unity', 'belonging'],
  overwhelmed: ['rest', 'surrender', 'acceptance', 'peace', 'detachment', 'breath', 'simplicity', 'trust', 'stillness'],
  grateful:    ['gratitude', 'grace', 'blessing', 'gift', 'abundance', 'devotion', 'offering', 'service', 'love'],
};

// Score a single entry against a set of keywords
function scoreEntry(entry: { meaning: string; title: string; original: string; tags: string[] }, keywords: string[]): number {
  const text = `${entry.meaning} ${entry.title} ${entry.tags.join(' ')}`.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) score += 1;
    // Bonus for appearing in the Sanskrit/original verse (signals a core concept)
    if (entry.original.toLowerCase().includes(kw)) score += 0.5;
  }
  return score;
}

export async function POST(req: Request) {
  const { mood, tradition } = await req.json().catch(() => ({}));
  if (!mood) return NextResponse.json({ error: 'mood required' }, { status: 400 });

  const moodKey = `${mood.toLowerCase()}:${tradition ?? ''}`;
  const apiKey = process.env.GEMINI_API_KEY;

  const keywords = MOOD_SEEDS[mood.toLowerCase()] ?? MOOD_SEEDS.seeking;

  // Filter by tradition if given, otherwise all
  const pool = tradition
    ? ALL_LIBRARY_ENTRIES.filter(e => e.tradition === tradition)
    : ALL_LIBRARY_ENTRIES;

  // Score + sort
  const scored = pool
    .map(e => ({ entry: e, score: scoreEntry(e, keywords) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  // Take top 20 candidates
  const candidates = scored.slice(0, 20).map(x => x.entry);

  // Shuffle top 6 from candidates to add variety across sessions
  const top6 = candidates
    .slice(0, 12)
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);

  if (!apiKey || top6.length === 0) {
    return NextResponse.json({ results: top6.map(e => ({ entry: e, insight: null })) });
  }

  // ── Check in-memory cache ────────────────────────────────────────────────────
  const cached = _moodCache.get(moodKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    // Return the cached verse+insight pairs together — insights are verse-specific,
    // so we must use the same top6 they were generated for (not a new shuffle).
    return NextResponse.json({
      results: cached.top6.map((entry, i) => ({ entry, insight: cached.insights[i] ?? null })),
    });
  }

  // ── Gemini: one-line insight per verse (flash-lite → flash fallback) ─────────
  const prompt = `You are a wise dharmic guide. For each verse below, write a single warm sentence (max 18 words) connecting it to the mood: "${mood}".

Return ONLY a JSON array of exactly ${top6.length} strings — one per verse, in the same order:
${top6.map((e, i) => `${i + 1}. [${e.source}] ${e.meaning.slice(0, 120)}`).join('\n')}

Return: ["insight1", "insight2", ...]`;

  let insights: string[] = top6.map(() => '');

  try {
    for (const model of GEMINI_MODELS) {
      const res = await fetch(`${geminiUrl(model)}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.55, maxOutputTokens: 400 },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) {
          try {
            const parsed = JSON.parse(match[0]);
            if (Array.isArray(parsed)) insights = parsed.map(String);
          } catch { /* use empty */ }
        }
        break; // success — stop trying models
      }

      // 429 = quota hit, 404 = model not found — try next
      if (res.status === 429 || res.status === 404) {
        console.warn(`[mood] ${model} → ${res.status}, trying fallback`);
        continue;
      }
      break; // other errors — don't retry
    }

    // Cache the insights for this mood+tradition for 1 hour
    _moodCache.set(moodKey, { insights, top6, ts: Date.now() });

  } catch (e) {
    console.error('[mood] Gemini fetch error:', e);
    // Return results without insights rather than failing
  }

  return NextResponse.json({
    results: top6.map((entry, i) => ({ entry, insight: insights[i] || null })),
  });
}
