import { NextResponse } from 'next/server';
import { ALL_LIBRARY_ENTRIES } from '@/lib/library-content';
import { generateWithProvider } from '@/lib/ai/providers/inference';

// POST /api/discover/mood
// Body: { mood: string, tradition?: string }
// Returns up to 6 curated verses matching the mood via keyword scoring
// + a one-line AI insight per verse via the Pramana provider stack.
// Results are cached in-memory for 1 hour per mood+tradition.

// ── Simple 1-hour in-memory cache (keyed by mood:tradition) ──────────────────
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

  // Shuffle top 12 candidates and take 6 for variety across sessions
  const top6 = scored
    .slice(0, 12)
    .map(x => x.entry)
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);

  if (top6.length === 0) {
    return NextResponse.json({ results: [] });
  }

  // ── Check in-memory cache ─────────────────────────────────────────────────
  const cached = _moodCache.get(moodKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    // Insights are verse-specific — return the cached verse+insight pairs together
    return NextResponse.json({
      results: cached.top6.map((entry, i) => ({ entry, insight: cached.insights[i] ?? null })),
    });
  }

  // ── Pramana provider stack: one-line insight per verse ───────────────────
  const insightPrompt = `You are a wise dharmic guide. For each verse below, write a single warm sentence (max 18 words) connecting it to the mood: "${mood}".

Return ONLY a JSON array of exactly ${top6.length} strings — one per verse, in the same order:
${top6.map((e, i) => `${i + 1}. [${e.source}] ${e.meaning.slice(0, 120)}`).join('\n')}

Return: ["insight1", "insight2", ...]`;

  let insights: string[] = top6.map(() => '');

  try {
    const result = await generateWithProvider(
      { user: insightPrompt, temperature: 0.55, maxOutputTokens: 400 },
      { responseFormat: 'json' },
    );
    const match = result.text.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) insights = parsed.map(String);
    }
    // Cache the insights for this mood+tradition for 1 hour
    _moodCache.set(moodKey, { insights, top6, ts: Date.now() });
  } catch (e) {
    console.error('[mood] provider error:', e);
    // Gracefully return verses without insights rather than failing the request
  }

  return NextResponse.json({
    results: top6.map((entry, i) => ({ entry, insight: insights[i] || null })),
  });
}
