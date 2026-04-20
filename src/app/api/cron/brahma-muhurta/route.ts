import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';
import { canSendInLocalWindow, getLocalDateIso, resolveTimeZone } from '@/lib/sacred-time';
import { getPanchangTimes, isInWindow } from '@/lib/panchang';

// ─── Brahma Muhurta Sacred Alert ──────────────────────────────────────────────
//
// Fires a precise wake-up notification exactly when each user's personal
// Brahma Muhurta window opens (1hr 36min before sunrise, typically 4–5 AM).
//
// Schedule: run every 15 min via Vercel cron (*/15 * * * *).
//   Each run only sends to users whose BM window opened in the LAST 15 minutes,
//   so each user receives exactly one alert per day.
//
// notification_key: `brahma_muhurta:${localDate}` — deduplicates any double-sends.
//
// Requires in vercel.json / next.config:
//   { "path": "/api/cron/brahma-muhurta", "schedule": "*/15 * * * *" }
// ─────────────────────────────────────────────────────────────────────────────

/** How far back to look for BM window opens (ms). Should match cron interval. */
const LOOKBACK_MS = 16 * 60_000; // 16 minutes (extra 1 min overlap for safety)

const TRADITION_COPY: Record<string, { title: string; body: string }> = {
  hindu: {
    title: '🌅 Brahma Muhurta — The Sacred Hour Opens',
    body:  'This is the most auspicious time for sadhana. Rise, bathe, and begin your morning sequence while the world sleeps.',
  },
  sikh: {
    title: '☬ Amrit Vela — The Ambrosial Hour',
    body:  'Waheguru\'s grace flows most freely now. Begin your Nitnem before the mind fills with the day\'s noise.',
  },
  buddhist: {
    title: '☸️ Dawn — Your Practice Window',
    body:  'The mind is clearest before the world stirs. Sit now. Even fifteen minutes in this stillness is worth much more.',
  },
  jain: {
    title: '🤲 Brahma Muhurta — Begin Pratikraman',
    body:  'Jai Jinendra! The pre-dawn hour is auspicious for reflection and Navkar Mantra. Begin with a purified heart.',
  },
};

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const now        = new Date();
    const baseUrl    = new URL(request.url).origin;
    const actionUrl  = new URL('/nitya-karma', baseUrl).toString();

    // ── Step 1: Fetch all users ───────────────────────────────────────────────
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, tradition, timezone, latitude, longitude, notification_quiet_hours_start, notification_quiet_hours_end');

    if (usersError) {
      console.error('BM cron users query failed:', usersError);
      return NextResponse.json({ error: `Profiles query failed: ${usersError.message}` }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users', sent: 0 });
    }

    // ── Step 2: Find users whose BM window JUST opened (within last 16 min) ───
    type Profile = typeof users[0];
    const justOpenedUsers: Profile[] = [];

    for (const user of users) {
      const lat = (user as any).latitude  as number | null;
      const lon = (user as any).longitude as number | null;
      const tz  = resolveTimeZone((user as any).timezone);

      // Check quiet hours first
      const inQuietHours = !canSendInLocalWindow(
        now, tz, 4, // 4 AM local target — used only for quiet-hour check
        (user as any).notification_quiet_hours_start ?? null,
        (user as any).notification_quiet_hours_end   ?? null,
        1, // narrow ±1h window for quiet-hour check only
      );
      if (inQuietHours) continue;

      try {
        const times = getPanchangTimes(now, lat, lon);
        const bmStart = times.brahmaMuhurtaStart;

        // BM window opened in the last LOOKBACK_MS milliseconds?
        const msSinceBmStart = now.getTime() - bmStart.getTime();
        if (msSinceBmStart >= 0 && msSinceBmStart <= LOOKBACK_MS) {
          justOpenedUsers.push(user);
        }
      } catch {
        // If panchang calc fails, skip this user — don't want to spam
      }
    }

    if (justOpenedUsers.length === 0) {
      return NextResponse.json({ message: 'No users entering BM window right now', sent: 0 });
    }

    // ── Step 3: Build notification rows ──────────────────────────────────────
    const notifications = justOpenedUsers.map((u) => {
      const tz        = resolveTimeZone((u as any).timezone);
      const localDate = getLocalDateIso(now, tz);
      const tradition = (u as any).tradition ?? 'hindu';
      const copy      = TRADITION_COPY[tradition] ?? TRADITION_COPY.hindu;

      return {
        user_id:          u.id,
        title:            copy.title,
        body:             copy.body,
        emoji:            '🌅',
        type:             'brahma_muhurta' as const,
        action_url:       '/nitya-karma',
        notification_key: `brahma_muhurta:${localDate}`,
        local_date:       localDate,
        sent_timezone:    tz,
      };
    });

    // ── Step 4: Upsert with dedup ─────────────────────────────────────────────
    let totalInserted    = 0;
    const insertedUserIds: string[] = [];

    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      const { data: insertedRows, error: insertError } = await supabase
        .from('notifications')
        .upsert(batch, { onConflict: 'user_id,notification_key', ignoreDuplicates: true })
        .select('user_id');

      if (insertError) {
        console.error('BM cron insert failed:', insertError);
        return NextResponse.json({ error: `Notification insert failed: ${insertError.message}` }, { status: 500 });
      }

      totalInserted += insertedRows?.length ?? 0;
      insertedUserIds.push(...(insertedRows ?? []).map((r: { user_id: string }) => r.user_id));
    }

    // ── Step 5: Send push notifications ──────────────────────────────────────
    // Group by tradition for batched OneSignal calls
    const byTradition = new Map<string, { userIds: string[]; copy: { title: string; body: string } }>();
    for (const u of justOpenedUsers) {
      if (!insertedUserIds.includes(u.id)) continue;
      const t    = (u as any).tradition ?? 'hindu';
      const copy = TRADITION_COPY[t] ?? TRADITION_COPY.hindu;
      if (!byTradition.has(t)) byTradition.set(t, { userIds: [], copy });
      byTradition.get(t)!.userIds.push(u.id);
    }

    let totalPushTargets = 0;
    for (const { userIds, copy } of byTradition.values()) {
      const pushResult = await sendOneSignalPush({
        userIds,
        title: copy.title,
        body:  copy.body,
        url:   actionUrl,
        data:  { type: 'brahma_muhurta' },
      });
      totalPushTargets += pushResult.sent;
    }

    return NextResponse.json({
      message:       'Brahma Muhurta alerts sent',
      just_opened:   justOpenedUsers.length,
      inserted:      totalInserted,
      push_targets:  totalPushTargets,
    });

  } catch (error) {
    console.error('BM cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Brahma Muhurta cron crashed' },
      { status: 500 }
    );
  }
}
