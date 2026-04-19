import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';
import { canSendInLocalWindow, getLocalDateIso, resolveTimeZone } from '@/lib/sacred-time';
import { getPanchangTimes, getTithiReminder, isInWindow } from '@/lib/panchang';

// ─── Tithi Reminder Cron ──────────────────────────────────────────────────────
// Schedule: 2 AM UTC + 8 AM UTC daily (catches 7 AM IST and ~9 AM for Europe).
// For each user, computes today's tithi from the Panchang engine using their
// saved coordinates. When today is a special observance (Ekadashi, Purnima,
// Amavasya, Pradosh, Chaturthi, Shivaratri), sends a tradition-aware reminder.
// Skips users not in their local morning window or currently in Rahu Kalam.

const TARGET_LOCAL_HOUR = 8; // ~8 AM local — after sunrise, before the day gets busy

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
    const actionPath = '/panchang';
    const actionUrl  = new URL(actionPath, baseUrl).toString();
    const now        = new Date();

    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, tradition, timezone, latitude, longitude, wants_festival_reminders, notification_quiet_hours_start, notification_quiet_hours_end');

    if (usersError) {
      console.error('Tithi cron users query failed:', usersError);
      return NextResponse.json({ error: `Profiles query failed: ${usersError.message}` }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users', sent: 0 });
    }

    // ── Filter: morning window + opt-in ─────────────────────────────────────
    const windowUsers = users.filter((user) => {
      if ((user as any).wants_festival_reminders === false) return false; // respect global preference
      const tz = resolveTimeZone((user as any).timezone);
      return canSendInLocalWindow(
        now, tz, TARGET_LOCAL_HOUR,
        (user as any).notification_quiet_hours_start ?? null,
        (user as any).notification_quiet_hours_end   ?? null,
        2,
      );
    });

    if (windowUsers.length === 0) {
      return NextResponse.json({ message: 'No users in morning window', sent: 0 });
    }

    // ── Build per-user tithi notifications ───────────────────────────────────
    const notifications: Array<{
      user_id:          string;
      title:            string;
      body:             string;
      emoji:            string;
      type:             'festival';
      action_url:       string;
      notification_key: string;
      local_date:       string;
      sent_timezone:    string;
    }> = [];

    for (const user of windowUsers) {
      const tz        = resolveTimeZone((user as any).timezone);
      const localDate = getLocalDateIso(now, tz);
      const tradition = (user as any).tradition ?? 'hindu';
      const lat       = (user as any).latitude  as number | null;
      const lon       = (user as any).longitude as number | null;

      let times;
      try {
        times = getPanchangTimes(now, lat, lon);
      } catch {
        continue; // skip user if panchang calculation fails
      }

      // Only send on special tithis
      const reminder = getTithiReminder(times.tithiIndex, tradition);
      if (!reminder) continue;

      // Skip if user is in their Rahu Kalam right now
      if (isInWindow(now, times.rahuKaalStart, times.rahuKaalEnd, 0)) continue;

      notifications.push({
        user_id:          user.id,
        title:            reminder.title,
        body:             reminder.body,
        emoji:            reminder.emoji,
        type:             'festival',
        action_url:       actionPath,
        notification_key: `tithi:${times.tithiIndex}:${localDate}`,
        local_date:       localDate,
        sent_timezone:    tz,
      });
    }

    if (notifications.length === 0) {
      return NextResponse.json({ message: 'No special tithis today for users in window', sent: 0 });
    }

    // ── Insert + dedup ───────────────────────────────────────────────────────
    let totalInserted    = 0;
    const insertedRows_all: { user_id: string; title: string; body: string }[] = [];

    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      const { data: insertedRows, error: insertError } = await supabase
        .from('notifications')
        .upsert(batch, { onConflict: 'user_id,notification_key', ignoreDuplicates: true })
        .select('user_id, title, body');

      if (insertError) {
        console.error('Tithi cron insert failed:', insertError);
        return NextResponse.json({ error: `Notification insert failed: ${insertError.message}` }, { status: 500 });
      }

      totalInserted += insertedRows?.length ?? 0;
      insertedRows_all.push(...(insertedRows ?? []));
    }

    // ── OneSignal push — group by title/body so we batch identical messages ──
    const pushBuckets = new Map<string, { title: string; body: string; userIds: string[] }>();
    for (const row of insertedRows_all) {
      const key = `${row.title}::${row.body}`;
      if (!pushBuckets.has(key)) pushBuckets.set(key, { title: row.title, body: row.body, userIds: [] });
      pushBuckets.get(key)!.userIds.push(row.user_id);
    }

    let totalPushTargets = 0;
    for (const { title, body, userIds } of pushBuckets.values()) {
      const pushResult = await sendOneSignalPush({ userIds, title, body, url: actionUrl, data: { type: 'tithi' } });
      totalPushTargets += pushResult.sent;
    }

    return NextResponse.json({
      message:      'Tithi reminders sent',
      candidates:   windowUsers.length,
      inserted:     totalInserted,
      push_targets: totalPushTargets,
    });
  } catch (error) {
    console.error('Tithi cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Tithi cron crashed' },
      { status: 500 }
    );
  }
}
