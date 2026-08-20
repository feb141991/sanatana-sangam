import { NextRequest, NextResponse } from "next/server";
import { ALL_LIBRARY_ENTRIES } from "@/lib/library-content";
import { generateWithProvider } from "@/lib/ai/providers/inference";
import { emitEvent, emitError } from "@/lib/monitoring/events";
import { getApiUser } from "@/lib/api-auth";
import { rejectLargeRequest, asBoundedString, checkDurableRateLimit } from "@/lib/api-security";

// POST /api/discover/mood
// Body: { mood: string, tradition?: string }
// Returns up to 6 curated verses matching the mood via keyword scoring
// + a one-line AI insight per verse via the Pramana provider stack.
// Results are cached in-memory with LRU eviction (max 500 entries, 1 hour TTL).

const MAX_BODY_BYTES = 8 * 1024;
const HOURLY_RATE_LIMIT = 60;
const MAX_MOOD_CACHE_ENTRIES = 500;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

type LibraryEntry = (typeof ALL_LIBRARY_ENTRIES)[number];
interface CacheEntry { insights: string[]; top6: LibraryEntry[]; ts: number }
const _moodCache = new Map<string, CacheEntry>();

function getCachedMood(key: string): CacheEntry | null {
  const entry = _moodCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts >= CACHE_TTL_MS) {
    _moodCache.delete(key);
    return null;
  }
  // Move to recent position in LRU
  _moodCache.delete(key);
  _moodCache.set(key, entry);
  return entry;
}

function setCachedMood(key: string, entry: CacheEntry) {
  if (_moodCache.has(key)) {
    _moodCache.delete(key);
  } else if (_moodCache.size >= MAX_MOOD_CACHE_ENTRIES) {
    // Evict oldest entry
    const oldestKey = _moodCache.keys().next().value;
    if (oldestKey) _moodCache.delete(oldestKey);
  }
  _moodCache.set(key, entry);
}

// ── Mood → keyword seeds ──────────────────────────────────────────────────────
const MOOD_SEEDS: Record<string, string[]> = {
  anxious:     ["fear", "worry", "peace", "calm", "steady", "equanimity", "freedom", "courage", "surrender", "trust"],
  grieving:    ["grief", "sorrow", "loss", "impermanence", "death", "rebirth", "soul", "eternal", "consolation", "peace"],
  angry:       ["anger", "desire", "attachment", "ego", "control", "let go", "patience", "forgiveness", "compassion"],
  scattered:   ["focus", "mind", "attention", "concentration", "practice", "discipline", "steady", "meditation", "clarity"],
  lost:        ["path", "dharma", "purpose", "duty", "direction", "guidance", "teacher", "light", "truth", "wisdom"],
  joyful:      ["joy", "bliss", "gratitude", "celebration", "abundance", "love", "devotion", "beauty", "delight"],
  seeking:     ["truth", "knowledge", "liberation", "self", "brahman", "atman", "understanding", "inquiry", "wisdom"],
  lonely:      ["connection", "love", "sangha", "community", "divine", "presence", "within", "unity", "belonging"],
  overwhelmed: ["rest", "surrender", "acceptance", "peace", "detachment", "breath", "simplicity", "trust", "stillness"],
  grateful:    ["gratitude", "grace", "blessing", "gift", "abundance", "devotion", "offering", "service", "love"],
};

function scoreEntry(entry: { meaning: string; title: string; original: string; tags: string[] }, keywords: string[]): number {
  const text = (entry.meaning + " " + entry.title + " " + entry.tags.join(" ")).toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) score += 1;
    if (entry.original.toLowerCase().includes(kw)) score += 0.5;
  }
  return score;
}

export async function POST(req: NextRequest) {
  const sizeError = rejectLargeRequest(req, MAX_BODY_BYTES);
  if (sizeError) return sizeError;

  const { user, error, supabase } = await getApiUser(req);
  if (!user || error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateRejection = await checkDurableRateLimit(
    "discover-mood:" + user.id,
    HOURLY_RATE_LIMIT,
    60 * 60 * 1000,
    supabase
  );
  if (rateRejection) return rateRejection;

  const body = await req.json().catch(() => ({}));
  const mood = asBoundedString(body?.mood, 50);
  if (!mood) return NextResponse.json({ error: "mood required (max 50 chars)" }, { status: 400 });

  const tradition = asBoundedString(body?.tradition, 30);
  const moodKey = mood.toLowerCase() + ":" + (tradition ?? "");
  const keywords = MOOD_SEEDS[mood.toLowerCase()] ?? MOOD_SEEDS.seeking;

  const pool = tradition
    ? ALL_LIBRARY_ENTRIES.filter(e => e.tradition === tradition)
    : ALL_LIBRARY_ENTRIES;

  const scored = pool
    .map(e => ({ entry: e, score: scoreEntry(e, keywords) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const top6 = scored
    .slice(0, 12)
    .map(x => x.entry)
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);

  if (top6.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const cached = getCachedMood(moodKey);
  if (cached) {
    return NextResponse.json({
      results: cached.top6.map((entry, i) => ({ entry, insight: cached.insights[i] ?? null })),
    });
  }

  const insightPrompt = "You are a wise dharmic guide. For each verse below, write a single warm sentence (max 18 words) connecting it to the mood: \"" + mood + "\".\n\nReturn ONLY a JSON array of exactly " + top6.length + " strings — one per verse, in the same order:\n" + top6.map((e, i) => (i + 1) + ". [" + e.source + "] " + e.meaning.slice(0, 120)).join("\n") + "\n\nReturn: [\"insight1\", \"insight2\", ...]";

  let insights: string[] = top6.map(() => "");
  const startTime = Date.now();

  try {
    const result = await generateWithProvider(
      {
        user: insightPrompt,
        temperature: 0.55,
        reasoningEffort: "none",
        maxOutputTokens: 2048,
      },
      { responseFormat: "json" },
    );
    const match = result.text.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) insights = parsed.map(String);
    }
    setCachedMood(moodKey, { insights, top6, ts: Date.now() });
    emitEvent({
      severity: "P3",
      domain: "ai",
      route: "/api/discover/mood",
      latency_ms: Date.now() - startTime,
      provider: result.provider,
      model: result.modelUsed,
      fallback_used: result.provider !== process.env.PRAMANA_INFERENCE_PROVIDER?.trim(),
      context: {
        feature: "discover_mood",
        mood,
        tradition: tradition ?? "all",
      },
    });
  } catch (e) {
    console.error("[mood] provider error:", e);
    emitError("ai", e, "P2", { route: "/api/discover/mood", latency_ms: Date.now() - startTime });
  }

  return NextResponse.json({
    results: top6.map((entry, i) => ({ entry, insight: insights[i] || null })),
  });
}
