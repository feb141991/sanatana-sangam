import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { localSpiritualDate } from '@/lib/sacred-time';
import { getTodayPanchang } from '@/lib/panchang';
import { generateWithProvider } from '@/lib/ai/providers/inference';
import { buildNotificationSafetyResponse, getNotificationSafetyState } from '@/lib/notification-safety';
import { buildDigestPanchangSignature } from '@/lib/digest-variant';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Batch cron can take a while — allow up to 5 minutes
export const maxDuration = 300;

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  tradition: string | null;
  spiritual_level: string | null;
  full_name: string | null;
  timezone: string | null;
}

interface RawProfileRow {
  id: string;
  tradition: string | null;
  spiritual_level: string | null;
  full_name: string | null;
  timezone: string | null;
}

interface DigestPayload {
  headline: string;
  body: string;
  fact: string;
  action: { label: string; href: string; type: 'link' | 'primary' };
  panchang: {
    tithi: number;
    tithiName: string;
    paksha: string;
    weekday: string;
    weekdayDeity: string;
  };
}

interface GeneratedDigest {
  payload: DigestPayload;
  source: 'ai' | 'fallback';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPrompt(
  tradition: string,
  level: string,
  panchang: ReturnType<typeof getTodayPanchang>,
): string {
  const { tithi, tithiName, paksha, weekday, weekdayDeity, isEkadashi, isPurnima, isAmavasya, nakshatra } = panchang;
  return `You are a precise dharmic scholar. Generate a daily digest for a ${tradition} practitioner (${level}).

PANCHANG TODAY:
- Tithi: ${tithiName} (${paksha} Paksha, day ${tithi} of 30)
- Nakshatra: ${nakshatra ?? 'unknown'}
- Weekday: ${weekday} — deity: ${weekdayDeity}
${isEkadashi ? '- ⚠️ TODAY IS EKADASHI — the most important fasting tithi of the fortnight' : ''}
${isPurnima ? '- ⚠️ TODAY IS PURNIMA — full moon' : ''}
${isAmavasya ? '- ⚠️ TODAY IS AMAVASYA — new moon, ancestor remembrance' : ''}

REQUIREMENTS (follow exactly):
1. "headline": Name the specific tithi + ONE concrete significance. Max 8 words. Example: "Tritiya — Goddess Gauri's Auspicious Third Tithi"
2. "body": 2 sentences max. Sentence 1: What THIS tithi specifically means in ${tradition} tradition — name the deity, story, or vrata if one exists. Sentence 2: One concrete practice for today.
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
}

function buildFallback(panchang: ReturnType<typeof getTodayPanchang>): DigestPayload {
  const { tithi, tithiName, paksha, weekday, weekdayDeity } = panchang;
  return {
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
    action: { label: 'Go to Pathshala', href: '/pathshala', type: 'primary' },
    panchang: { tithi, tithiName, paksha, weekday, weekdayDeity },
  };
}

async function generateDigest(
  tradition: string,
  level: string,
  panchang: ReturnType<typeof getTodayPanchang>,
): Promise<GeneratedDigest> {
  const fallback = buildFallback(panchang);
  let raw = '';
  try {
    const result = await generateWithProvider(
      {
        system: 'You generate warm, structured JSON for a daily spiritual/dharmic digest.',
        user: buildPrompt(tradition, level, panchang),
        temperature: 0.7,
        reasoningEffort: 'none',
        maxOutputTokens: 2048,
      },
      {
        responseFormat: 'json',
        providerOverride: 'sarvam-hosted',
      },
    );
    raw = result.text;
  } catch (err) {
    console.warn('[digest/generate] AI generation failed, using fallback:', err);
    return { payload: fallback, source: 'fallback' };
  }

  const match =
    raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]) as DigestPayload;
      if (parsed?.headline) return { payload: parsed, source: 'ai' };
    } catch {
      // fall through to fallback
    }
  }
  return { payload: fallback, source: 'fallback' };
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  // IMPORTANT: auth is unconditional — if CRON_SECRET is unset the route is locked.
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { isDryRun, skipDelivery, disabledReason } = getNotificationSafetyState('digest', request);

  // ── Env ───────────────────────────────────────────────────────────────────
  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // ── 1. Compute today's spiritual date (IST anchor, brahma-muhurta = 4) ────
  // This is only a broad batch filter. Definitive dedupe/upsert uses each
  // user's own spiritual date later in the per-user loop.
  const today = localSpiritualDate('Asia/Kolkata', 4);

  // ── 2. Fetch users who have NO digest row for today (batch cap 500) ───────
  const { data: users, error: fetchErr } = await supabase.rpc(
    'get_users_without_digest',
    { target_date: today, batch_limit: 500 },
  );

  // Fallback to manual query if the RPC doesn't exist yet
  let rows: UserRow[] = users ?? [];
  if (fetchErr || !users) {
    const { data: rawRows, error: qErr } = await supabase
      .from('profiles')
      .select(`
        id,
        tradition,
        spiritual_level,
        full_name,
        timezone
      `)
      .limit(500);

    if (qErr) {
      console.error('[digest/generate] Failed to fetch users:', qErr);
      return NextResponse.json({ error: qErr.message }, { status: 500 });
    }

    // Filter to those missing a digest row for today
    const { data: existingDigests } = await supabase
      .from('recommendations')
      .select('user_id')
      .eq('date', today)
      .eq('type', 'daily_digest');

    const doneSet = new Set((existingDigests ?? []).map((r: { user_id: string }) => r.user_id));

    const rawProfileRows = (rawRows ?? []) as RawProfileRow[];
    rows = rawProfileRows
      .filter((u) => !doneSet.has(u.id))
      .map((u) => ({
        id:              u.id,
        tradition:       u.tradition,
        spiritual_level: u.spiritual_level,
        full_name:       u.full_name,
        timezone:        u.timezone,
      }));
  }

  if (!rows.length) {
    return NextResponse.json({ generated: 0, queued: 0, message: 'All users already have a digest for today.' });
  }

  const contexts = rows.map((user) => {
    const timezone = user.timezone ?? 'Asia/Kolkata';
    const spiritualDate = localSpiritualDate(timezone, 4);
    return {
      user,
      tradition: user.tradition ?? 'general',
      level: user.spiritual_level ?? 'beginner',
      spiritualDate,
      panchang: getTodayPanchang(undefined, timezone),
    };
  });
  const userIds = contexts.map(({ user }) => user.id);
  const spiritualDates = [...new Set(contexts.map(({ spiritualDate }) => spiritualDate))];
  const { data: existingRows, error: existingError } = await supabase
    .from('recommendations')
    .select('user_id,date')
    .eq('type', 'daily_digest')
    .in('user_id', userIds)
    .in('date', spiritualDates);
  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }
  const existingKeys = new Set(
    (existingRows ?? []).map((row) => `${row.user_id}|${row.date}`),
  );
  const eligibleContexts = contexts.filter(
    ({ user, spiritualDate }) => !existingKeys.has(`${user.id}|${spiritualDate}`),
  );

  if (isDryRun || skipDelivery) {
    return NextResponse.json(buildNotificationSafetyResponse('digest', { isDryRun, isDisabled: skipDelivery, skipDelivery, disabledReason }, {
      eligibleCount: eligibleContexts.length,
      skippedCount: rows.length - eligibleContexts.length,
      wouldSendCount: eligibleContexts.length,
    }));
  }

  // ── 4. Process in concurrent batches of 10 ────────────────────────────────
  const BATCH_SIZE = 10;
  let generated = 0;
  let queuedCount = 0;

  // Memoize LLM generation per run by the exact (tradition, level, userToday) triple.
  // Preserves per-user spiritual timezone date boundaries while eliminating duplicate AI calls.
  const digestCache = new Map<string, Promise<GeneratedDigest>>();
  const persistedVariantKeys = new Set<string>();

  for (let i = 0; i < eligibleContexts.length; i += BATCH_SIZE) {
    const batch = eligibleContexts.slice(i, i + BATCH_SIZE);
    
    // We will collect users to push to after generating digests
    const notificationRows: Array<{
      user_id: string;
      title: string;
      body: string;
      send_at: string;
      notification_type: string;
      notification_key: string;
      metadata: Record<string, unknown>;
    }> = [];
    const recommendationRows: Array<{
      user_id: string;
      date: string;
      type: string;
      content: DigestPayload;
      generated_at: string;
    }> = [];

    const results = await Promise.allSettled(
      batch.map(async ({ user, tradition, level, spiritualDate: userToday, panchang: userPanchang }) => {

        // a. Generate digest with timezone-aware memoization
        const panchangSignature = buildDigestPanchangSignature(userPanchang);
        const cacheKey = `${tradition}|${level}|${userToday}|${panchangSignature}`;
        let digestPromise = digestCache.get(cacheKey);
        if (!digestPromise) {
          digestPromise = generateDigest(tradition, level, userPanchang);
          digestCache.set(cacheKey, digestPromise);
        }
        const generatedDigest = await digestPromise;
        const digest = generatedDigest.payload;

        if (!persistedVariantKeys.has(cacheKey)) {
          persistedVariantKeys.add(cacheKey);
          const { error: variantError } = await supabase
            .from('daily_digest_variants' as unknown as 'recommendations')
            .upsert({
              spiritual_date: userToday,
              tradition,
              spiritual_level: level,
              language: 'en',
              panchang_signature: panchangSignature,
              content: digest,
              status: generatedDigest.source === 'fallback' ? 'fallback' : 'ready',
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as never, {
              onConflict: 'spiritual_date,tradition,spiritual_level,language,panchang_signature',
            });
          if (variantError) throw variantError;
        }

        recommendationRows.push({
          user_id: user.id,
          date: userToday,
          type: 'daily_digest',
          content: digest,
          generated_at: new Date().toISOString(),
        });
        notificationRows.push({
          user_id: user.id,
          title: `Dharmic Digest · ${userPanchang.tithiName}`,
          body: digest.body.slice(0, 80),
          send_at: new Date().toISOString(),
          notification_type: 'daily_digest',
          notification_key: `daily-digest:${user.id}:${userToday}`,
          metadata: { url: '/home', type: 'daily_digest', spiritual_date: userToday, panchang_signature: panchangSignature },
        });
      }),
    );

    let recommendationsPersisted = false;
    if (recommendationRows.length > 0) {
      const { error: recommendationError } = await supabase
        .from('recommendations')
        .upsert(recommendationRows, { onConflict: 'user_id,date,type' });
      if (recommendationError) {
        console.warn('[digest/generate] recommendation batch upsert failed:', recommendationError.message);
      } else {
        recommendationsPersisted = true;
        generated += recommendationRows.length;
      }
    }

    if (recommendationsPersisted && notificationRows.length > 0) {
      const { data: queued, error: queueError } = await supabase
        .from('notification_schedule')
        .upsert(notificationRows, { onConflict: 'notification_key', ignoreDuplicates: true })
        .select('id');
      if (queueError) {
        console.warn('[digest/generate] notification queue insert failed:', queueError.message);
      } else {
        queuedCount += queued?.length ?? 0;
      }
    }

    // Log any unexpected rejections per batch (shouldn't happen — inner errors are caught above)
    results.forEach((r, idx) => {
      if (r.status === 'rejected') {
        console.warn(`[digest/generate] batch item ${i + idx} rejected:`, r.reason);
      }
    });
  }

  return NextResponse.json({ generated, queued: queuedCount });
}
