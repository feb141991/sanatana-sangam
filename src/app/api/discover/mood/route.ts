import { NextResponse } from 'next/server';
import { ALL_LIBRARY_ENTRIES } from '@/lib/library-content';

// POST /api/discover/mood
// Body: { mood: string, tradition?: string }
// Returns up to 6 curated verses matching the mood via keyword scoring.
// Optional Gemini re-ranking/commentary if API key is set.

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || top6.length === 0) {
    return NextResponse.json({ results: top6.map(e => ({ entry: e, insight: null })) });
  }

  // ── Optional Gemini: add a one-line insight for each verse ──────────────────
  const prompt = `You are a wise dharmic guide. For each verse below, write a single warm sentence (max 18 words) connecting it to the mood: "${mood}".

Return ONLY a JSON array of exactly ${top6.length} strings — one per verse, in the same order:
${top6.map((e, i) => `${i + 1}. [${e.source}] ${e.meaning.slice(0, 120)}`).join('\n')}

Return: ["insight1", "insight2", ...]`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.55, maxOutputTokens: 400 },
      }),
    });

    let insights: string[] = top6.map(() => '');
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
    }

    return NextResponse.json({
      results: top6.map((entry, i) => ({ entry, insight: insights[i] || null })),
    });
  } catch {
    return NextResponse.json({ results: top6.map(e => ({ entry: e, insight: null })) });
  }
}
