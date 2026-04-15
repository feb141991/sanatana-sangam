// ============================================================
// Edge Function: ai-personalise
// Generates today's personalised content for a user via Gemini Flash.
// Called by the nightly cron OR on-demand when cache is empty.
//
// Data sources:
//   user_practice      — computed practice profile
//   mala_sessions      — recent japa (existing Sangam table)
//   sadhana_events     — shloka reads
//   scripture_chunks   — next verse
//   sankalpa           — active commitment
//   festivals          — today's festival/vrata (existing Sangam table)
//
// POST body:
//   user_id   string   — the user to personalise for
//
// Deploy:
//   supabase functions deploy ai-personalise
// Secrets needed:
//   supabase secrets set GEMINI_API_KEY=AIza...
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { user_id } = await req.json();
    if (!user_id) return errorResponse('user_id is required', 400);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date().toISOString().split('T')[0];
    const year = new Date().getFullYear();

    // ── 1. Fetch user practice profile ──
    const { data: profile } = await supabase
      .from('user_practice')
      .select('*')
      .eq('user_id', user_id)
      .single();

    const userTradition = profile?.tradition ?? 'general';

    // ── 2. Fetch today's festivals from the Sangam festivals table ──
    // Include: festivals for the user's tradition, shared festivals, and tradition-null entries
    const { data: todayFestivals } = await supabase
      .from('festivals')
      .select('name, description, type, tradition, emoji')
      .eq('date', today)
      .eq('year', year)
      .or(`is_shared.eq.true,tradition.is.null,tradition.eq.${userTradition}`)
      .order('tradition', { ascending: false }) // tradition-specific first
      .limit(5);

    // ── 3. Fetch tomorrow's festivals (for proactive vrata prep) ──
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data: tomorrowFestivals } = await supabase
      .from('festivals')
      .select('name, description, type, emoji')
      .eq('date', tomorrowStr)
      .eq('year', year)
      .or(`is_shared.eq.true,tradition.is.null,tradition.eq.${userTradition}`)
      .limit(3);

    // ── 4. Fetch recent mala sessions (japa context for personalisation) ──
    const { data: recentMala } = await supabase
      .from('mala_sessions')
      .select('mantra, count, duration_seconds, completed_at')
      .eq('user_id', user_id)
      .order('completed_at', { ascending: false })
      .limit(5);

    const lastMantra = recentMala?.[0]?.mantra ?? null;

    // ── 5. Fetch user's last read verse ──
    const { data: lastRead } = await supabase
      .from('sadhana_events')
      .select('event_data')
      .eq('user_id', user_id)
      .eq('event_type', 'shloka_read')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const lastVerse = (lastRead?.event_data as Record<string, unknown>) ?? {};

    // ── 6. Get next unread Gita verse ──
    const lastChapter = (lastVerse.chapter as number) ?? 1;
    const lastVerseNum = (lastVerse.verse as number) ?? 0;
    const { data: nextVerse } = await supabase
      .from('scripture_chunks')
      .select('*')
      .eq('text_id', 'gita')
      .or(`chapter.gt.${lastChapter},and(chapter.eq.${lastChapter},verse.gt.${lastVerseNum})`)
      .order('chapter', { ascending: true })
      .order('verse', { ascending: true })
      .limit(1)
      .single();

    const shloka = nextVerse ?? {
      text_id: 'gita', chapter: 2, verse: 47,
      transliteration: 'karmaṇy evādhikāras te mā phaleṣu kadācana',
      translation: 'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions.',
      tags: ['karma', 'action', 'duty'],
    };

    // ── 7. Get active sankalpa ──
    const { data: sankalpa } = await supabase
      .from('sankalpa')
      .select('description, current_streak, target_days')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // ── 8. Build panchang ──
    // Layer 1 (always works): astronomical tithi/paksha/nakshatra + recurring vratas
    // Layer 2 (enrichment):   festivals table adds named festival names, emoji, descriptions
    const panchang = buildPanchang(todayFestivals ?? [], tomorrowFestivals ?? []);

    // ── 9. Build Gemini prompt context ──
    const profileSummary = profile
      ? `Tradition: ${profile.tradition ?? 'general'}, Path: ${profile.primary_path ?? 'bhakti'}, Depth: ${profile.content_depth ?? 'intermediate'}, Streak: ${profile.current_streak ?? 0} days, Consistency: ${Math.round((profile.consistency_score ?? 0.5) * 100)}%`
      : 'New devotee, general tradition, beginner depth';

    const recentJapa = lastMantra
      ? `Recent japa: "${lastMantra}"`
      : 'No recent japa recorded';

    const activeSankalpa = sankalpa
      ? `${sankalpa.description} (day ${sankalpa.current_streak}/${sankalpa.target_days})`
      : 'none';

    const shlokaRef = `Gita ${shloka.chapter}.${shloka.verse}`;

    // ── 10. Call Gemini ──
    const content = await callGemini({
      profileSummary,
      shlokaRef,
      shlokaText: shloka.translation,
      panchang,
      activeSankalpa,
      recentJapa,
      currentStreak: profile?.current_streak ?? 0,
      nudgeStyle: profile?.re_engagement_style ?? 'gentle',
    });

    // ── 11. Cache in recommendations table ──
    const responsePayload = {
      greeting: content.greeting,
      shloka: { ...shloka, id: shloka.id ?? undefined },
      shloka_context: content.shloka_context,
      practice_suggestion: content.practice_suggestion,
      nudge: content.nudge ?? null,
      panchang,
      generated_at: new Date().toISOString(),
    };

    await supabase.from('recommendations').upsert({
      user_id,
      date: today,
      type: 'daily_content',
      content: responsePayload,
    }, { onConflict: 'user_id,date,type' });

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('ai-personalise error:', err);
    return errorResponse('Internal error', 500);
  }
});

// ── Build panchang — two-layer architecture ──
//
// Layer 1 — Astronomical (computeAstroPanchang):
//   Always-working computation. Gives tithi, paksha, nakshatra, and
//   recurring vratas (Ekadashi, Pradosh, Purnima, Amavasya etc.) from
//   first principles. Works forever, no DB or yearly data entry needed.
//
// Layer 2 — festivals table (enrichment only):
//   Adds named festivals (Diwali, Holi, Navratri etc.) with emoji and
//   description. These shift yearly and need curation — exactly what
//   the festivals table is for. If the table has no data, Layer 1
//   still provides complete, correct vrata information.
//
// The two layers COMBINE, never override each other:
//   - recurring_vrata = "Ekadashi"          ← from Layer 1 (always)
//   - named_festival  = "Vaikunta Ekadashi" ← from Layer 2 (when available)
//   Gemini sees both and can say "Today is Vaikunta Ekadashi (Ekadashi)"

interface FestivalRow {
  name: string;
  description: string;
  type: string | null;
  tradition: string | null;
  emoji: string | null;
}

function buildPanchang(
  todayFestivals: FestivalRow[],
  tomorrowFestivals: FestivalRow[]
): Record<string, string> {
  // Layer 1: astronomical truth — tithi, paksha, nakshatra, recurring vrata
  const astro = computeAstroPanchang();

  // Layer 2: named festival enrichment from DB (may be empty — that's fine)
  const namedFestival   = todayFestivals[0] ?? null;
  const tomorrowFestival = tomorrowFestivals[0] ?? null;

  // Combine: recurring vrata from astronomy is always present.
  // Named festival from DB is added alongside it, not replacing it.
  // e.g. vrata = "Ekadashi", named_festival = "Vaikunta Ekadashi"
  // If no named festival: named_festival = '' — Gemini uses vrata only.
  // If no recurring vrata: vrata = '', named_festival has the full context.
  const allTodayLabels = [
    astro.recurring_vrata,
    ...todayFestivals.map(f => `${f.emoji ?? ''} ${f.name}`.trim()),
  ].filter(Boolean).join(' · ');

  return {
    // Core astronomical fields (always populated)
    date:            new Date().toISOString().split('T')[0],
    tithi:           astro.tithi,
    tithi_number:    String(astro.tithiNum),
    paksha:          astro.paksha,
    nakshatra:       astro.nakshatra,

    // Recurring vrata from tithi logic — works every year forever
    vrata:           astro.recurring_vrata,
    vaara_vrata:     astro.vaara_vrata,

    // Named festival from festivals table — enrichment, may be empty
    named_festival:       namedFestival?.name        ?? '',
    named_festival_emoji: namedFestival?.emoji       ?? '',
    named_festival_desc:  namedFestival?.description ?? '',
    named_festival_type:  namedFestival?.type        ?? '',

    // Combined label for Gemini context (e.g. "Ekadashi · 🪔 Diwali")
    all_today: allTodayLabels,

    // Tomorrow — lets Gemini mention upcoming observances in practice suggestion
    tomorrow_festival: tomorrowFestival?.name  ?? '',
    tomorrow_emoji:    tomorrowFestival?.emoji ?? '',
  };
}

// ── Astronomical panchang — permanent, year-independent ──
//
// Uses a verified new moon epoch (J2000 reference: 2000-01-06 18:14 UTC)
// and the mean lunar month (29.53058867 days) to compute the current
// lunar day (tithi) and paksha from first principles.
//
// This gives accurate Ekadashi, Pradosh, Purnima, Amavasya etc.
// for any date without any database or yearly data entry.
// Error margin: ±1 tithi (acceptable for push notifications).
// For ±0 accuracy, use a full ephemeris library.

// Known new moon: 2000-01-06T18:14:00Z (J2000 astronomical epoch)
const J2000_NEW_MOON_MS = 947182440000;
const LUNAR_MONTH_MS    = 29.53058867 * 86400000; // 2,551,442,884 ms

function computeAstroPanchang(date: Date = new Date()): {
  lunarDay: number;   // 1–30 position in lunar month
  tithiNum: number;   // 1–15 within the paksha
  paksha: 'shukla' | 'krishna';
  tithi: string;
  nakshatra: string;
  recurring_vrata: string;   // Ekadashi / Pradosh / Purnima / Amavasya / ''
  vaara_vrata: string;       // Mon → Som Vaar, Sat → Shani Vaar, etc.
} {
  // Position in lunar cycle (0.0 = new moon, 0.5 = full moon)
  const elapsed   = date.getTime() - J2000_NEW_MOON_MS;
  const lunarAge  = ((elapsed % LUNAR_MONTH_MS) + LUNAR_MONTH_MS) % LUNAR_MONTH_MS;
  const lunarDay  = Math.min(30, Math.floor((lunarAge / LUNAR_MONTH_MS) * 30) + 1);

  // Days 1–15: Shukla (waxing). Days 16–30: Krishna (waning).
  const paksha   = lunarDay <= 15 ? 'shukla' : 'krishna';
  const tithiNum = lunarDay <= 15 ? lunarDay : lunarDay - 15;

  const tithiNames = [
    '', 'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
    'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
    'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi',
    paksha === 'shukla' ? 'Purnima' : 'Amavasya',
  ];
  const pakshaSuffix = paksha === 'shukla' ? 'Shukla Paksha' : 'Krishna Paksha';
  const tithi = `${tithiNames[tithiNum] ?? 'Pratipada'} ${pakshaSuffix}`;

  // Nakshatra: 27-nakshatra cycle, one nakshatra ≈ 0.9 days
  // Offset from a known reference (Ashwini at J2000 new moon)
  const daysSinceEpoch = elapsed / 86400000;
  const nakshatras = [
    'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra',
    'Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni',
    'Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula',
    'Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha',
    'Purva Bhadrapada','Uttara Bhadrapada','Revati',
  ];
  const nakshatra = nakshatras[Math.floor(Math.abs(daysSinceEpoch) * (27 / 27.3217)) % 27];

  // Recurring vratas — pure tithi logic, works for all time
  let recurring_vrata = '';
  if (tithiNum === 11)                               recurring_vrata = 'Ekadashi';
  else if (tithiNum === 13)                          recurring_vrata = 'Pradosh';
  else if (tithiNum === 4)                           recurring_vrata = 'Vinayaka Chaturthi';
  else if (paksha === 'shukla' && tithiNum === 15)   recurring_vrata = 'Purnima';
  else if (paksha === 'krishna' && tithiNum === 15)  recurring_vrata = 'Amavasya';
  else if (paksha === 'krishna' && tithiNum === 8)   recurring_vrata = 'Kalashtami';

  // Vaara vratas — day-of-week observances
  const dayVratas: Record<number, string> = {
    0: 'Surya Vaar (Aditya Hridayam recommended)',
    1: 'Som Vaar (Shiva abhishek recommended)',
    4: 'Brihaspati Vaar (Vishnu puja recommended)',
    5: 'Shukra Vaar (Devi puja recommended)',
    6: 'Shani Vaar (Hanuman Chalisa recommended)',
  };
  const vaara_vrata = dayVratas[date.getDay()] ?? '';

  return { lunarDay, tithiNum, paksha, tithi, nakshatra, recurring_vrata, vaara_vrata };
}

// ── Gemini call ──

interface GeminiInput {
  profileSummary: string;
  shlokaRef: string;
  shlokaText: string;
  panchang: Record<string, string>;
  activeSankalpa: string;
  recentJapa: string;
  currentStreak: number;
  nudgeStyle: string;
}

async function callGemini(
  input: GeminiInput
): Promise<{ greeting: string; shloka_context: string; practice_suggestion: string; nudge?: string }> {
  const geminiKey = Deno.env.get('GEMINI_API_KEY');

  const { panchang, shlokaRef, shlokaText, currentStreak, nudgeStyle } = input;

  if (!geminiKey) {
    return {
      greeting: `Jai Shri Krishna. ${panchang.vrata_emoji} Today is ${panchang.vrata || panchang.tithi}. May your practice be blessed.`,
      shloka_context: shlokaText,
      practice_suggestion: `Begin your morning with 4 rounds of your chosen mantra, then read today's shloka (${shlokaRef}) with contemplation.`,
    };
  }

  // Layer 1 vrata (astronomical, always present when applicable)
  // + Layer 2 named festival (from festivals table, may be empty)
  // Both are surfaced to Gemini — they complement, never replace each other.
  const vrataLines = [
    panchang.vrata         && `Recurring vrata: ${panchang.vrata}`,
    panchang.named_festival && `Named festival: ${panchang.named_festival_emoji} ${panchang.named_festival}${panchang.named_festival_desc ? ' — ' + panchang.named_festival_desc : ''}`,
    panchang.vaara_vrata   && `Day observance: ${panchang.vaara_vrata}`,
  ].filter(Boolean).join('\n');

  const tomorrowContext = panchang.tomorrow_festival
    ? `Tomorrow: ${panchang.tomorrow_emoji} ${panchang.tomorrow_festival} — reference this in practice_suggestion.`
    : '';

  const streakNote = currentStreak > 0
    ? `Streak: ${currentStreak} days maintained.`
    : `The devotee recently missed practice days. Nudge style: ${nudgeStyle}.`;

  const prompt = `You are a warm, knowledgeable Sanatani spiritual guide within the Sanatana Sangam app.

DEVOTEE PROFILE: ${input.profileSummary}
${input.recentJapa}
TODAY'S PANCHANG: Tithi: ${panchang.tithi}, Paksha: ${panchang.paksha}, Nakshatra: ${panchang.nakshatra}
${vrataLines}
${tomorrowContext}
TODAY'S SHLOKA: ${shlokaRef} — "${shlokaText}"
ACTIVE SANKALPA: ${input.activeSankalpa}
${streakNote}

Generate a JSON object (pure JSON, no markdown) with exactly these keys:
{
  "greeting": "Personalised morning greeting (1-2 sentences). Reference today's festival/tithi if present. Warm, like a guru greeting a beloved shishya.",
  "shloka_context": "2-3 sentence explanation of today's shloka, relevant to this devotee's path and depth. Personal, not textbook.",
  "practice_suggestion": "One specific practice for today. Consider the panchang and tomorrow's upcoming festival. Concrete (e.g. '5 rounds of Gayatri at sunrise, light a lamp for Ekadashi tonight' not 'do some meditation').",
  "nudge": "Only if streak is 0: short motivational message matching their style. Omit this key entirely if streak > 0."
}`;

  const resp = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 500, temperature: 0.6, responseMimeType: 'application/json' },
    }),
  });

  if (!resp.ok) {
    console.error('Gemini error:', await resp.text());
    return {
      greeting: `${panchang.vrata_emoji} Jai Shri Krishna. Today is ${panchang.vrata || panchang.tithi}.`,
      shloka_context: shlokaText,
      practice_suggestion: `Begin with 4 rounds of your mantra, then read ${shlokaRef} with quiet contemplation.`,
    };
  }

  const json = await resp.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

  try {
    return JSON.parse(text);
  } catch {
    return {
      greeting: `Jai Shri Krishna. Today is ${panchang.tithi}.`,
      shloka_context: shlokaText,
      practice_suggestion: 'Begin with your mantra practice at this auspicious hour.',
    };
  }
}

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
