import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { localSpiritualDate } from '@/lib/sacred-time';
import { getTodayPanchang } from '@/lib/panchang';
import { generateWithProvider } from '@/lib/ai/providers/inference';

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
  endpoint: string | null;
  p256dh: string | null;
  auth: string | null;
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
): Promise<DigestPayload> {
  const fallback = buildFallback(panchang);
  let raw = '';
  try {
    const result = await generateWithProvider(
      {
        system: 'You generate warm, structured JSON for a daily spiritual/dharmic digest.',
        user: buildPrompt(tradition, level, panchang),
        temperature: 0.7,
        reasoningEffort: 'none',
        maxOutputTokens: 4096,
      },
      {
        responseFormat: 'json',
        providerOverride: 'sarvam-hosted',
      },
    );
    raw = result.text;
  } catch (err) {
    console.warn('[digest/generate] AI generation failed, using fallback:', err);
    return fallback;
  }

  const match =
    raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]) as DigestPayload;
      if (parsed?.headline) return parsed;
    } catch {
      // fall through to fallback
    }
  }
  return fallback;
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

  // ── Env ───────────────────────────────────────────────────────────────────
  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const vapidPublicKey  = process.env.VAPID_PUBLIC_KEY ?? '';
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? '';

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const canPush = vapidPublicKey && vapidPrivateKey;
  if (canPush) {
    webpush.setVapidDetails(
      'mailto:support@sanatansangam.com',
      vapidPublicKey,
      vapidPrivateKey,
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // ── 1. Compute today's spiritual date (IST anchor, brahma-muhurta = 4) ────
  // This is only a broad batch filter. Definitive dedupe/upsert uses each
  // user's own spiritual date later in the per-user loop.
  const today = localSpiritualDate('Asia/Kolkata', 4);

  // ── 2. Fetch users who have NO digest row for today (batch cap 500) ───────
  // We join push_subscriptions so we can send the notification in the same pass.
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
        timezone,
        push_subscriptions ( endpoint, p256dh, auth )
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

    rows = ((rawRows ?? []) as any[])
      .filter((u: any) => !doneSet.has(u.id))
      .map((u: any) => {
        const sub = u.push_subscriptions?.[0] ?? null;
        return {
          id:              u.id,
          tradition:       u.tradition,
          spiritual_level: u.spiritual_level,
          full_name:       u.full_name,
          timezone:        u.timezone,
          endpoint:        sub?.endpoint ?? null,
          p256dh:          sub?.p256dh   ?? null,
          auth:            sub?.auth     ?? null,
        };
      });
  }

  if (!rows.length) {
    return NextResponse.json({ generated: 0, notified: 0, message: 'All users already have a digest for today.' });
  }

  // ── 4. Process in concurrent batches of 10 ────────────────────────────────
  const BATCH_SIZE = 10;
  let generated = 0;
  let notified  = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (user) => {
        const tradition = user.tradition ?? 'general';
        const level     = user.spiritual_level ?? 'beginner';

        // Compute the user's own local spiritual date — a user in Sydney at
        // 23:00 UTC is already in tomorrow's tithi; one in New York at 23:00
        // UTC is still on yesterday's IST date.
        const userToday = localSpiritualDate(user.timezone ?? 'Asia/Kolkata', 4);

        // Definitive per-user dedupe check must use the user's local spiritual date,
        // not the batch-wide UTC approximation.
        const { data: existingForUser, error: existingForUserErr } = await supabase
          .from('recommendations')
          .select('user_id')
          .eq('user_id', user.id)
          .eq('date', userToday)
          .eq('type', 'daily_digest')
          .maybeSingle();

        if (existingForUserErr) {
          console.warn(`[digest/generate] per-user digest check failed for ${user.id}:`, existingForUserErr.message);
        }

        if (existingForUser) {
          return;
        }

        // Panchang computed for the user's local day, not server UTC
        const userPanchang = getTodayPanchang(undefined, user.timezone ?? 'Asia/Kolkata');

        // a. Generate digest
        const digest = await generateDigest(tradition, level, userPanchang);

        // b. Upsert into recommendations (use userToday, not the global UTC today)
        const { error: upsertErr } = await supabase.from('recommendations').upsert(
          {
            user_id:      user.id,
            date:         userToday,
            type:         'daily_digest',
            content:      digest,
            generated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,date,type' },
        );
        if (upsertErr) {
          console.warn(`[digest/generate] upsert failed for ${user.id}:`, upsertErr.message);
        } else {
          generated++;
        }

        // c. Send web-push if subscription exists
        if (canPush && user.endpoint && user.p256dh && user.auth) {
          const pushPayload = JSON.stringify({
            title: `Dharmic Digest · ${userPanchang.tithiName}`,
            body:  digest.body.slice(0, 80),
            icon:  '/icons/icon-192x192.png',
            data:  { url: '/home' },
          });

          try {
            await webpush.sendNotification(
              { endpoint: user.endpoint, keys: { p256dh: user.p256dh, auth: user.auth } },
              pushPayload,
            );
            notified++;
          } catch (pushErr: any) {
            console.warn(`[digest/generate] push failed for ${user.id}:`, pushErr?.statusCode ?? pushErr);
            // Clean up expired subscriptions
            if (pushErr?.statusCode === 410) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('user_id', user.id)
                .eq('endpoint', user.endpoint);
            }
          }
        }
      }),
    );

    // Log any unexpected rejections per batch (shouldn't happen — inner errors are caught above)
    results.forEach((r, idx) => {
      if (r.status === 'rejected') {
        console.warn(`[digest/generate] batch item ${i + idx} rejected:`, r.reason);
      }
    });
  }

  return NextResponse.json({ generated, notified });
}
