import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { localSpiritualDate } from '@/lib/sacred-time';

// GET /api/home/personalise
// Returns today's personalised shloka + practice suggestion for the authenticated user.
// Checks the recommendations cache first; generates via Gemini if stale.

// Model priority: lite first (higher free-tier RPM), flash as fallback
const GEMINI_MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];
function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

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

    // ── 0. Fetch timezone for spiritual date ─────────────────────────────────────
    const { data: tzRow } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', user.id)
      .maybeSingle();

    // Spiritual day: starts at 4 AM local time, not midnight UTC
    const today = localSpiritualDate(tzRow?.timezone, 4);

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
      if (c?.suggestion) {
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
      const fallback = FALLBACK_SHLOKAS[new Date().getDate() % FALLBACK_SHLOKAS.length];
      return NextResponse.json({ suggestion: fallback.suggestion, nudge: null, context_label: 'Today\'s practice', from_cache: false });
    }

    // ── 3. Generate via Gemini ───────────────────────────────────────────────────
    const tradition = profile?.tradition ?? 'general';
    const level     = profile?.spiritual_level ?? 'beginner';
    const seeking   = (profile?.seeking as string[])?.join(', ') ?? '';
    const name      = profile?.full_name ?? profile?.username ?? 'Seeker';

    const dayOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

    const prompt = `You are a warm, wise spiritual guide. Generate a personalised daily practice suggestion for ${name}.

USER PROFILE:
- Tradition: ${tradition}
- Spiritual level: ${level}
- Currently seeking: ${seeking || 'general guidance'}
- Day: ${dayOfWeek}

Return ONLY this JSON (no markdown fences, no extra keys):
{
  "suggestion": "<A specific, actionable practice for today matching their level and seeking. 2-3 sentences. Concrete — not vague. For example: 'Spend 10 minutes with Pranayama before breakfast today' or 'Read one chapter of the Gita and journal one insight.' Vary by day and level.>",
  "nudge": "<One warm, personal sentence of encouragement. Optional — null is fine.>",
  "context_label": "<A 2-4 word label for the type of practice, e.g. 'Morning sadhana', 'Contemplative reading', 'Breathwork focus'. Used as the section eyebrow.>",
  "action": {
    "label": "<Short CTA label, e.g. 'Open Mantra' or 'Start Mala'>",
    "href": "<A valid internal route, e.g. '/pathshala?tab=scripture&entryId=[id]' for scripture or '/bhakti/mala' for tools>",
    "type": "<'link' | 'primary'> "
  }
}

Keep the tone warm, grounded, and personal — not preachy. No shloka text needed.`;

    let raw = '';
    for (const model of GEMINI_MODELS) {
      const res = await fetch(`${geminiUrl(model)}?key=${apiKey}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        break;
      }

      console.warn(`[personalise] model=${model} status=${res.status}`);
      if (res.status === 429 || res.status === 404) continue;
      break; // other error — fall through to fallback
    }

    if (!raw) {
      const fallback = FALLBACK_SHLOKAS[new Date().getDate() % FALLBACK_SHLOKAS.length];
      return NextResponse.json({ suggestion: fallback.suggestion, nudge: null, context_label: 'Today\'s practice', from_cache: false });
    }
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
    let parsed: Record<string, string | null> | null = null;
    if (match) {
      try { parsed = JSON.parse(match[1]); } catch { /* fall through */ }
    }

    if (!parsed?.suggestion) {
      const fallback = FALLBACK_SHLOKAS[new Date().getDate() % FALLBACK_SHLOKAS.length];
      parsed = { suggestion: fallback.suggestion, nudge: null, context_label: 'Today\'s practice' };
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
