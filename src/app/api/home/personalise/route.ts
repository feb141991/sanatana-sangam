import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET /api/home/personalise
// Returns today's personalised shloka + practice suggestion for the authenticated user.
// Checks the recommendations cache first; generates via Gemini if stale.

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

// Curated fallback shlokas (tradition-neutral; used when Gemini is unavailable)
const FALLBACK_SHLOKAS = [
  {
    text:    'योगः कर्मसु कौशलम्',
    source:  'Bhagavad Gita 2.50',
    meaning: 'Yoga is skill in action.',
    suggestion: 'Today, bring full attention to one task at a time. That is your practice.',
  },
  {
    text:    'तत् त्वम् असि',
    source:  'Chandogya Upanishad 6.8.7',
    meaning: 'That thou art — the infinite Self is your true nature.',
    suggestion: 'Sit quietly for five minutes and rest in the awareness that witnesses your thoughts.',
  },
  {
    text:    'अहिंसा परमो धर्मः',
    source:  'Mahabharata 13.117.37',
    meaning: 'Non-violence is the highest dharma.',
    suggestion: 'Notice any harsh self-talk today and replace it with compassion.',
  },
];

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const today = new Date().toISOString().split('T')[0];

    // ── 1. Check recommendations cache ──────────────────────────────────────────
    const { data: cached } = await supabase
      .from('recommendations')
      .select('content')
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('type', 'daily_content')
      .maybeSingle();

    if (cached?.content) {
      const c = cached.content as Record<string, unknown>;
      if (c?.shloka_text && c?.suggestion) {
        return NextResponse.json({ ...c, from_cache: true });
      }
    }

    // ── 2. Fetch user profile ────────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('tradition, sampradaya, spiritual_level, seeking, full_name, username')
      .eq('id', user.id)
      .maybeSingle();

    if (!apiKey) {
      // Return a fallback shloka without AI
      const fallback = FALLBACK_SHLOKAS[new Date().getDate() % FALLBACK_SHLOKAS.length];
      return NextResponse.json({ shloka_text: fallback.text, shloka_source: fallback.source, shloka_meaning: fallback.meaning, suggestion: fallback.suggestion, nudge: null, from_cache: false });
    }

    // ── 3. Generate via Gemini ───────────────────────────────────────────────────
    const tradition = profile?.tradition ?? 'general';
    const level     = profile?.spiritual_level ?? 'beginner';
    const seeking   = (profile?.seeking as string[])?.join(', ') ?? '';
    const name      = profile?.full_name ?? profile?.username ?? 'Seeker';

    const dayOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

    const prompt = `You are a warm, wise spiritual guide. Generate today's personalised spiritual content for ${name}.

USER PROFILE:
- Tradition: ${tradition}
- Spiritual level: ${level}
- Currently seeking: ${seeking || 'general guidance'}
- Day: ${dayOfWeek}

Return ONLY this JSON (no markdown fences):
{
  "shloka_text": "<A short verse or saying relevant to their tradition and current seeking. Can be Sanskrit, Gurmukhi, Pali, or another sacred language — 1-2 lines max.>",
  "shloka_source": "<Text name and reference, e.g. 'Bhagavad Gita 2.47'>",
  "shloka_meaning": "<Plain English meaning of the verse, 1 sentence>",
  "suggestion": "<A specific, actionable practice suggestion for today that matches their level and seeking. 2-3 sentences. Make it concrete — not vague.>",
  "nudge": "<A single warm, encouraging sentence for their journey today. Optional — can be null.>"
}

Keep the tone warm, personal, and grounded — not preachy.`;

    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
      }),
    });

    if (!res.ok) {
      const fallback = FALLBACK_SHLOKAS[new Date().getDate() % FALLBACK_SHLOKAS.length];
      return NextResponse.json({ shloka_text: fallback.text, shloka_source: fallback.source, shloka_meaning: fallback.meaning, suggestion: fallback.suggestion, nudge: null, from_cache: false });
    }

    const data  = await res.json();
    const raw   = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
    let parsed: Record<string, string | null> | null = null;
    if (match) {
      try { parsed = JSON.parse(match[1]); } catch { /* fall through */ }
    }

    if (!parsed?.shloka_text) {
      const fallback = FALLBACK_SHLOKAS[new Date().getDate() % FALLBACK_SHLOKAS.length];
      parsed = { shloka_text: fallback.text, shloka_source: fallback.source, shloka_meaning: fallback.meaning, suggestion: fallback.suggestion, nudge: null };
    }

    // ── 4. Cache result ──────────────────────────────────────────────────────────
    await supabase.from('recommendations').upsert(
      { user_id: user.id, date: today, type: 'daily_content', content: parsed, generated_at: new Date().toISOString() },
      { onConflict: 'user_id,date,type' }
    ).then(({ error }) => { if (error) console.warn('[personalise] cache write failed:', error.message); });

    return NextResponse.json({ ...parsed, from_cache: false });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Personalise failed' }, { status: 500 });
  }
}
