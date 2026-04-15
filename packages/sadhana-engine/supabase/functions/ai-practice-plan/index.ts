// ============================================================
// ai-practice-plan — Personalised weekly sadhana plan
//
// Reads the user's profile, active sankalpas, current streak,
// panchang, and available time to generate a structured
// 7-day sadhana plan with daily intentions and milestones.
//
// POST { user_id, week_start_date?, available_minutes_per_day? }
// → { plan: DayPlan[], week_intention, generated_at }
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://mnbwodcswxoojndytngu.supabase.co';
const GEMINI_URL   = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const J2000_NEW_MOON_MS = 947182440000;
const LUNAR_MONTH_MS    = 29.53058867 * 86400000;

const TITHI_NAMES = ['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi',
  'Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima/Amavasya'];
const VAARA = ['Ravivar','Somvar','Mangalvar','Budhvar','Guruvar','Shukravar','Shanivar'];
const VAARA_VRATA: Record<string,string> = {
  'Somvar':'Somvar vrat (Shiva)', 'Mangalvar':'Mangalvar vrat (Hanuman/Devi)',
  'Guruvar':'Guruvar vrat (Vishnu)', 'Shukravar':'Shukravar vrat (Lakshmi)', 'Shanivar':'Shanivar vrat (Shani)',
};

function getPanchang(date: Date) {
  const elapsed  = date.getTime() - J2000_NEW_MOON_MS;
  const lunar    = ((elapsed % LUNAR_MONTH_MS) + LUNAR_MONTH_MS) % LUNAR_MONTH_MS;
  const lunarDay = Math.floor(lunar / (LUNAR_MONTH_MS / 30)) + 1;
  const paksha   = lunarDay <= 15 ? 'Shukla' : 'Krishna';
  const tithi_n  = lunarDay <= 15 ? lunarDay : lunarDay - 15;
  const vaara    = VAARA[date.getDay()];
  let vrata: string | null = null;
  if (tithi_n === 11) vrata = 'Ekadashi';
  else if (tithi_n === 13 || lunarDay === 28) vrata = 'Pradosh';
  else if (tithi_n === 4 && paksha === 'Shukla') vrata = 'Vinayaka Chaturthi';
  else if (lunarDay === 15) vrata = 'Purnima';
  else if (lunarDay === 30) vrata = 'Amavasya';
  else if (tithi_n === 8 && paksha === 'Krishna') vrata = 'Kalashtami';
  return {
    tithi: `${paksha} ${TITHI_NAMES[Math.min(tithi_n - 1, 14)]}`,
    vrata,
    vaara,
    vaara_vrata: VAARA_VRATA[vaara] ?? null,
    date: date.toISOString().split('T')[0],
  };
}

function getWeekPanchang(startDate: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return getPanchang(d);
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' },
  });

  try {
    const { user_id, week_start_date, available_minutes_per_day = 45 } = await req.json();
    if (!user_id) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });

    const supabase  = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const geminiKey = Deno.env.get('GEMINI_API_KEY');

    // Week starts today or given date
    const startDate = week_start_date ? new Date(week_start_date) : (() => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    })();

    const weekPanchang = getWeekPanchang(startDate);

    // Fetch user data in parallel
    const [profileRes, sankalpaRes, streakRes, malaRes] = await Promise.all([
      supabase.from('user_practice').select('*').eq('user_id', user_id).single(),
      supabase.from('sankalpa').select('*').eq('user_id', user_id).eq('status', 'active').order('started_at'),
      supabase.from('daily_sadhana').select('streak_count, any_practice, date').eq('user_id', user_id)
        .order('date', { ascending: false }).limit(7),
      supabase.from('mala_sessions').select('mantra, count, completed_at').eq('user_id', user_id)
        .order('completed_at', { ascending: false }).limit(5),
    ]);

    const profile    = profileRes.data;
    const sankalpas  = sankalpaRes.data ?? [];
    const recentDays = streakRes.data ?? [];
    const recentMala = malaRes.data ?? [];

    const currentStreak    = recentDays[0]?.streak_count ?? 0;
    const activeDaysThisWeek = recentDays.filter(d => d.any_practice).length;
    const lastMantra       = recentMala[0]?.mantra ?? null;
    const tradition        = profile?.tradition ?? 'general';
    const path             = profile?.primary_path ?? 'bhakti';
    const depth            = profile?.content_depth ?? 'beginner';
    const preferredTime    = profile?.preferred_time ?? 'morning';
    const consistency      = profile?.consistency_score ?? 0;

    // Identify special days this week
    const specialDays = weekPanchang
      .filter(p => p.vrata || p.vaara_vrata)
      .map(p => `${p.date} (${p.vaara}): ${[p.vrata, p.vaara_vrata].filter(Boolean).join(' + ')}`)
      .join('\n');

    // Active sankalpa summary
    const sankalpaLines = sankalpas.map(s =>
      `- ${s.type}: "${s.description}" — day ${s.current_streak}/${s.target_days}`
    ).join('\n') || 'None active';

    // Fallback plan (no Gemini)
    const fallbackPlan = weekPanchang.map((p, i) => ({
      date:       p.date,
      vaara:      p.vaara,
      tithi:      p.tithi,
      vrata:      p.vrata,
      vaara_vrata:p.vaara_vrata,
      intention:  p.vrata
        ? `${p.vrata} — fast, chant your ishta mantra 3 malas, read the associated katha.`
        : `Daily sadhana — japa, shloka, and aarti. Day ${i + 1} of your week.`,
      focus:      p.vrata ? 'vrata' : 'japa',
      japa_rounds: p.vrata ? 3 : 1,
      suggested_text: 'gita',
    }));

    if (!geminiKey) {
      return new Response(JSON.stringify({
        plan:            fallbackPlan,
        week_intention:  `A week of steady ${tradition} sadhana. Current streak: ${currentStreak} days.`,
        current_streak:  currentStreak,
        generated_at:    new Date().toISOString(),
      }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    const prompt = `You are a Vedic spiritual guide. Create a personalised 7-day sadhana plan for this devotee.

DEVOTEE PROFILE:
- Tradition: ${tradition}
- Spiritual path: ${path}
- Practice depth: ${depth}
- Preferred time: ${preferredTime}
- Current streak: ${currentStreak} days
- Active days this week: ${activeDaysThisWeek}/7
- Consistency score: ${Math.round((consistency ?? 0) * 100)}%
- Last mantra chanted: ${lastMantra ?? 'unknown'}
- Available time per day: ${available_minutes_per_day} minutes

ACTIVE SANKALPAS:
${sankalpaLines}

THIS WEEK'S PANCHANG (special days):
${specialDays || 'No major vratas this week — steady daily practice recommended'}

WEEK DAYS:
${weekPanchang.map(p => `${p.date} ${p.vaara}: ${p.tithi}${p.vrata ? ' [' + p.vrata + ']' : ''}`).join('\n')}

Create a structured 7-day plan. For each day provide:
- A specific daily intention (1-2 sentences, personalised to their tradition and the panchang)
- Primary focus: japa | shloka | vrata | seva | dhyana
- Recommended japa rounds (1-3 for regular days, 3-5 for vrata days)
- Suggested scripture (gita / isha_upanishad / hanuman_chalisa / vishnu_sahasranama)
- Any special practice for that day

Also provide:
- A single "week_intention" — a motivating theme for the whole week (1-2 sentences)
- A "milestone" — what completing this full week will mean spiritually

Respond in this exact JSON (no markdown):
{
  "week_intention": "...",
  "milestone": "...",
  "plan": [
    {
      "date": "YYYY-MM-DD",
      "vaara": "...",
      "tithi": "...",
      "vrata": null,
      "intention": "...",
      "focus": "japa",
      "japa_rounds": 1,
      "suggested_text": "gita",
      "special_practice": null
    }
  ]
}`;

    const resp  = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const gData = await resp.json();
    const raw   = gData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(raw); } catch { /* use fallback */ }

    // Merge panchang data (always authoritative) into parsed plan
    const plan = ((parsed.plan as Record<string,unknown>[]) ?? fallbackPlan).map((day, i) => ({
      ...day,
      vaara:       weekPanchang[i]?.vaara ?? day.vaara,
      tithi:       weekPanchang[i]?.tithi ?? day.tithi,
      vrata:       weekPanchang[i]?.vrata ?? null,
      vaara_vrata: weekPanchang[i]?.vaara_vrata ?? null,
    }));

    return new Response(JSON.stringify({
      plan,
      week_intention:  parsed.week_intention ?? `A week of steady ${tradition} sadhana.`,
      milestone:       parsed.milestone ?? null,
      current_streak:  currentStreak,
      active_sankalpas:sankalpas.length,
      generated_at:    new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
