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
    const prompt = `Generate a daily dharmic digest for a ${rawTradition} practitioner (${level}).
Today's panchang: tithi=${tithiName} (${paksha} Paksha), weekday=${weekday}, deity of the day=${weekdayDeity}, nakshatra=${nakshatra ?? 'unknown'}. ${isEkadashi ? 'Today is Ekadashi — a significant fasting day.' : ''}${panchangInfo.isPurnima ? ' Today is Purnima (full moon).' : ''}${panchangInfo.isAmavasya ? ' Today is Amavasya (new moon).' : ''}
Sunrise: ${fullPanchang.sunrise}, Rahu Kaal: ${fullPanchang.rahuKaal}.

Return JSON only:
{
  "headline": "<tithi + key significance, max 8 words>",
  "body": "<2-3 sentences — what this day means, a relevant myth or practice>",
  "fact": "<One surprising lesser-known fact about this tithi or deity>",
  "action": {
    "label": "<CTA>",
    "href": "<internal route>",
    "type": "link" | "primary"
  },
  "panchang": {
    "tithi": ${tithi},
    "tithiName": "${tithiName}",
    "paksha": "${paksha}",
    "weekday": "${weekday}",
    "weekdayDeity": "${weekdayDeity}"
  }
}`;

    const fallbackDigest = {
      headline: `${tithiName} of ${paksha} Paksha`,
      body: `Today is ${tithiName} during the ${paksha} phase of the moon, falling on a ${weekday}. It is a perfect day to connect with Lord ${weekdayDeity} and reflect on your dharmic journey.`,
      fact: `Each day of the lunar cycle carries unique qualities that support self-reflection and spiritual discipline.`,
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
