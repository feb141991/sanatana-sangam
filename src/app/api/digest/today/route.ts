import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { localSpiritualDate } from '@/lib/sacred-time';
import { calculatePanchang, getTodayPanchang } from '@/lib/panchang';
import { generateWithProvider } from '@/lib/ai/providers/inference';

// GET /api/digest/today
// Returns today's personalized daily dharmic digest for the authenticated user.
// Integrates local astronomy-based Panchang calculations and AI synthesis.

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    // ── 1. Fetch full profile (timezone + location + tradition) ─────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('tradition, spiritual_level, full_name, username, timezone, latitude, longitude')
      .eq('id', user.id)
      .maybeSingle();

    const today = localSpiritualDate(profile?.timezone, 4);

    // ── 2. Check recommendations cache ─────────────────────────────────────
    const { data: cached } = await supabase
      .from('recommendations')
      .select('content')
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('type', 'daily_digest')
      .maybeSingle();

    if (cached?.content) {
      const c = cached.content as Record<string, unknown>;
      if (c?.headline) {
        return NextResponse.json({ ...c, from_cache: true });
      }
    }

    // ── 3. Compute panchang ────────────────────────────────────────────────
    // Lightweight version (tithi, nakshatra, weekday) — timezone-aware so a
    // user in New York at 10 PM sees their local tithi, not server-UTC tomorrow.
    const panchangInfo = getTodayPanchang(undefined, profile?.timezone ?? 'Asia/Kolkata');
    const { tithi, tithiName, paksha, weekday, weekdayDeity, isEkadashi, nakshatra } = panchangInfo;

    // Full panchang (sunrise, Rahu Kaal, Brahma Muhurta) — uses user coords.
    // Ujjain (23.1765°N, 75.7885°E) is the traditional Indian meridian fallback.
    const lat = (profile?.latitude  as number | null) ?? 23.1765;
    const lon = (profile?.longitude as number | null) ?? 75.7885;
    const fullPanchang = calculatePanchang(new Date(), lat, lon, profile?.timezone ?? 'Asia/Kolkata');

    const rawTradition = profile?.tradition ?? 'general';
    const level = profile?.spiritual_level ?? 'beginner';

    // ── 5. Generate daily digest using Sarvam AI ──────────────────────────────
    const prompt = `You are a precise dharmic scholar. Generate a daily digest for a ${rawTradition} practitioner (${level}).

PANCHANG TODAY:
- Tithi: ${tithiName} (${paksha} Paksha, day ${tithi} of 30)
- Nakshatra: ${nakshatra ?? 'unknown'}
- Weekday: ${weekday} — deity: ${weekdayDeity}
- Sunrise: ${fullPanchang.sunrise} | Rahu Kaal: ${fullPanchang.rahuKaal}
${isEkadashi ? '- ⚠️ TODAY IS EKADASHI — the most important fasting tithi of the fortnight' : ''}
${panchangInfo.isPurnima ? '- ⚠️ TODAY IS PURNIMA — full moon' : ''}
${panchangInfo.isAmavasya ? '- ⚠️ TODAY IS AMAVASYA — new moon, ancestor remembrance' : ''}

REQUIREMENTS (follow exactly):
1. "headline": Name the specific tithi + ONE concrete significance. Max 8 words. Example: "Tritiya — Goddess Gauri's Auspicious Third Tithi"
2. "body": 2 sentences max. Sentence 1: What THIS tithi specifically means in ${rawTradition} tradition — name the deity, story, or vrata if one exists. Sentence 2: One concrete practice for today.
3. "fact": One surprising fact that most people don't know about ${weekdayDeity} or ${tithiName}. Must be specific — no generic statements about "the lunar cycle" or "spiritual energy."
4. "action": Route to a relevant section (/pathshala, /bhakti/mala, /japa, /bhakti/stotram, /panchang, /vrat).

FORBIDDEN phrases: "lunar cycle carries", "spiritual energy", "ancient wisdom", "connect with", "unique qualities", "sacred time", "dharmic journey".

Return ONLY this JSON:
{
  "headline": "...",
  "body": "...",
  "fact": "...",
  "action": { "label": "...", "href": "/...", "type": "primary" },
  "panchang": { "tithi": ${tithi}, "tithiName": "${tithiName}", "paksha": "${paksha}", "weekday": "${weekday}", "weekdayDeity": "${weekdayDeity}" }
}`;

    const fallbackDigest = {
      headline: `${tithiName} of ${paksha} Paksha`,
      body: `Today is ${tithiName} during the ${paksha} phase of the moon, falling on a ${weekday}. It is a perfect day to connect with Lord ${weekdayDeity} and reflect on your dharmic journey.`,
      fact: `${weekdayDeity} is worshipped on ${weekday}s — ${
  weekdayDeity === 'Shiva' ? "Mondays are sacred to Shiva because the Shiva Purana says the moon (Soma) rests on Shiva's matted hair" :
  weekdayDeity === 'Surya' ? "Sunday worship of Surya with Arghya (water offering at sunrise) is said to dispel eye ailments in the Aditya Hridayam" :
  weekdayDeity === 'Vishnu' ? "Wednesday (Budhavara) is linked to Vishnu in many regional traditions — the Vishnu Sahasranama is traditionally recited today" :
  weekdayDeity === 'Mangal' ? "Tuesday is sacred to Hanuman in the Vaishnava tradition and to Kartikeya in the Shaiva tradition" :
  weekdayDeity === 'Guru' ? "Thursdays honour the Guru lineage — many traditions begin new learning only on Thursday (Guruvara)" :
  weekdayDeity === 'Shukra' ? "Friday is auspicious for Lakshmi and Santoshi Mata — Fridays see the most temple visits in India" :
  "Saturday is sacred to Shani (Saturn) — the Shani Stotra is recited to neutralise difficult planetary transits"
}.`,
      action: { label: 'Go to Pathshala', href: '/pathshala', type: 'primary' as const },
      panchang: { tithi, tithiName, paksha, weekday, weekdayDeity },
    };

    let raw = '';
    try {
      const result = await generateWithProvider(
        {
          system: 'You generate warm, structured JSON for a daily spiritual/dharmic digest.',
          user: prompt,
          temperature: 0.7,
          reasoningEffort: 'none',
          maxOutputTokens: 1200,
        },
        {
          responseFormat: 'json',
          providerOverride: 'sarvam-hosted',
        }
      );
      raw = result.text;
    } catch (err) {
      console.warn('[digest] Provider generation failed, falling back to curated local content:', err);
    }

    let parsed: typeof fallbackDigest | null = null;
    if (raw) {
      const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
      if (match) {
        try {
          parsed = JSON.parse(match[1]);
        } catch {
          // fall through
        }
      }
    }

    if (!parsed?.headline) {
      parsed = fallbackDigest;
    }

    // ── 6. Cache result ────────────────────────────────────────────────────────
    await supabase.from('recommendations').upsert(
      {
        user_id: user.id,
        date: today,
        type: 'daily_digest',
        content: parsed,
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date,type' }
    ).then(({ error }) => {
      if (error) console.warn('[digest] cache write failed:', error.message);
    });

    return NextResponse.json({ ...parsed, from_cache: false });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Digest generation failed' }, { status: 500 });
  }
}
