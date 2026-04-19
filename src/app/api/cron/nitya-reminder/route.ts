import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';
import { canSendInLocalWindow, getLocalDateIso, resolveTimeZone } from '@/lib/sacred-time';
import { getPanchangTimes, getTithiReminder, isInWindow } from '@/lib/panchang';

// ─── Nitya Karma Morning Reminder Cron ───────────────────────────────────────
// Schedule: runs twice daily — 10:30 PM UTC (≈ 4 AM IST) and 6 AM UTC.
// Engine-aware:
//   • Uses getPanchangTimes() to check actual Brahma Muhurta for each user's
//     coordinates — users whose Brahma Muhurta window has passed already today
//     are skipped (they'll get it on the next cron run instead).
//   • Skips users currently in their Rahu Kalam window.
//   • Enriches notification copy with today's tithi (Ekadashi, Purnima, etc.).
// Finds users who have NOT started their morning sequence today (zero steps done).

const TARGET_LOCAL_HOUR   = 5;          // ~5 AM in user's local timezone
const RAHU_TOLERANCE_MS   = 5 * 60_000; // 5-min grace on Rahu window edges
const BRAHMA_TOLERANCE_MS = 60 * 60_000; // ±60 min around Brahma Muhurta window

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
    const baseUrl    = new URL(request.url).origin;
    const actionPath = '/nitya-karma';
    const actionUrl  = new URL(actionPath, baseUrl).toString();
    const now        = new Date();

    // Fetch users — now also select lat/lon for Panchang engine
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, tradition, timezone, latitude, longitude, notification_quiet_hours_start, notification_quiet_hours_end');

    if (usersError) {
      console.error('Nitya cron users query failed:', usersError);
      return NextResponse.json({ error: `Profiles query failed: ${usersError.message}` }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users', sent: 0 });
    }

    // ── Step 1: Timezone window filter (coarse — keeps cron fast) ────────────
    const windowUsers = users.filter((user) => {
      const tz = resolveTimeZone((user as any).timezone);
      return canSendInLocalWindow(
        now, tz, TARGET_LOCAL_HOUR,
        (user as any).notification_quiet_hours_start ?? null,
        (user as any).notification_quiet_hours_end   ?? null,
        2, // ±2h tolerance so both cron runs cover the globe
      );
    });

    if (windowUsers.length === 0) {
      return NextResponse.json({ message: 'No users in morning window', sent: 0 });
    }

    // ── Step 2: Panchang engine filter — per-user Brahma Muhurta + Rahu ──────
    const eligibleUsers = windowUsers.filter((user) => {
      const lat = (user as any).latitude  as number | null;
      const lon = (user as any).longitude as number | null;
      try {
        const times = getPanchangTimes(now, lat, lon);
        // Skip if we're outside the expanded Brahma Muhurta window
        if (!isInWindow(now, times.brahmaMuhurtaStart, times.brahmaMuhurtaEnd, BRAHMA_TOLERANCE_MS)) {
          return false;
        }
        // Skip if currently in Rahu Kalam (inauspicious — don't send a sadhana prompt then)
        if (isInWindow(now, times.rahuKaalStart, times.rahuKaalEnd, RAHU_TOLERANCE_MS)) {
          return false;
        }
        return true;
      } catch {
        // If panchang calc fails for any reason, fall back to timezone filter only
        return true;
      }
    });

    if (eligibleUsers.length === 0) {
      return NextResponse.json({ message: 'No users in Brahma Muhurta window', sent: 0 });
    }

    // ── Step 3: Find users who haven't started any steps today ───────────────
    const eligibleIds  = eligibleUsers.map(u => u.id);
    const localDates   = new Map<string, string>();
    for (const user of eligibleUsers) {
      const tz = resolveTimeZone((user as any).timezone);
      localDates.set(user.id, getLocalDateIso(now, tz));
    }

    const uniqueDates = [...new Set(localDates.values())];
    const { data: logRows } = await supabase
      .from('nitya_karma_log')
      .select('user_id, log_date')
      .in('user_id', eligibleIds)
      .in('log_date', uniqueDates);

    const startedUserIds = new Set(
      (logRows ?? [])
        .map((r: { user_id: string; log_date: string }) =>
          r.log_date === localDates.get(r.user_id) ? r.user_id : null
        )
        .filter(Boolean)
    );

    const unstartedUsers = eligibleUsers.filter(u => !startedUserIds.has(u.id));
    if (unstartedUsers.length === 0) {
      return NextResponse.json({ message: 'All morning-window users have already started', sent: 0 });
    }

    // ── Step 4: Build engine-enriched, tradition-aware notifications ──────────
    const TRADITION_NUDGE: Record<string, { title: string; body: string }> = {
      hindu:    { title: '🌅 Brahma Muhurta — Begin Your Sadhana', body: 'Suprabhat! Your morning sequence awaits. Start with snana and let the day begin in dharma.' },
      sikh:     { title: '☬ Amrit Vela — Begin Your Nitnem',       body: 'Sat Sri Akal! This is the ambrosial hour. Your morning Nitnem brings Waheguru\'s grace.' },
      buddhist: { title: '☸️ Morning Practice Awaits',               body: 'May this morning bring clarity. Begin your sitting before the day takes hold.' },
      jain:     { title: '🤲 Begin Your Morning Pratikraman',       body: 'Jai Jinendra! The dawn hour is auspicious. Begin your Samayika and Navkar Mantra.' },
    };

    const notifications = unstartedUsers.map((u) => {
      const tz        = resolveTimeZone((u as any).timezone);
      const localDate = getLocalDateIso(now, resolveTimeZone((u as any).timezone));
      const tradition = (u as any).tradition ?? 'hindu';
      const nudge     = TRADITION_NUDGE[tradition] ?? TRADITION_NUDGE.hindu;

      // Enrich body with today's tithi from the Panchang engine
      let tithiSuffix = '';
      try {
        const lat   = (u as any).latitude  as number | null;
        const lon   = (u as any).longitude as number | null;
        const times = getPanchangTimes(now, lat, lon);
        const tithiReminder = getTithiReminder(times.tithiIndex, tradition);
        if (tithiReminder) {
          tithiSuffix = ` Today is ${times.tithi} — ${tithiReminder.body}`;
        } else {
          tithiSuffix = ` Today's nakshatra is ${times.nakshatra}.`;
        }
      } catch { /* panchang enrichment is best-effort */ }

      return {
        user_id:          u.id,
        title:            nudge.title,
        body:             nudge.body + tithiSuffix,
        emoji:            '🌅',
        type:             'nitya' as const,
        action_url:       actionPath,
        notification_key: `nitya:morning:${localDate}`,
        local_date:       localDate,
        sent_timezone:    resolveTimeZone((u as any).timezone),
      };
    });

    // ── Step 5: Insert + deduplicate ─────────────────────────────────────────
    let totalInserted    = 0;
    const insertedUserIds: string[] = [];

    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      const { data: insertedRows, error: insertError } = await supabase
        .from('notifications')
        .upsert(batch, { onConflict: 'user_id,notification_key', ignoreDuplicates: true })
        .select('user_id');

      if (insertError) {
        console.error('Nitya cron insert failed:', insertError);
        return NextResponse.json({ error: `Notification insert failed: ${insertError.message}` }, { status: 500 });
      }

      totalInserted += insertedRows?.length ?? 0;
      insertedUserIds.push(...(insertedRows ?? []).map((r: { user_id: string }) => r.user_id));
    }

    // ── Step 6: OneSignal push — grouped by tradition ────────────────────────
    const byTradition = new Map<string, { userIds: string[]; nudge: { title: string; body: string } }>();
    for (const u of unstartedUsers) {
      if (!insertedUserIds.includes(u.id)) continue;
      const t     = (u as any).tradition ?? 'hindu';
      const nudge = TRADITION_NUDGE[t] ?? TRADITION_NUDGE.hindu;
      if (!byTradition.has(t)) byTradition.set(t, { userIds: [], nudge });
      byTradition.get(t)!.userIds.push(u.id);
    }

    let totalPushTargets = 0;
    for (const { userIds, nudge } of byTradition.values()) {
      const pushResult = await sendOneSignalPush({
        userIds,
        title: nudge.title,
        body:  nudge.body,
        url:   actionUrl,
        data:  { type: 'nitya' },
      });
      totalPushTargets += pushResult.sent;
    }

    return NextResponse.json({
      message:      'Nitya karma reminders sent',
      eligible:     eligibleUsers.length,
      unstarted:    unstartedUsers.length,
      inserted:     totalInserted,
      push_targets: totalPushTargets,
    });
  } catch (error) {
    console.error('Nitya cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nitya cron crashed' },
      { status: 500 }
    );
  }
}
