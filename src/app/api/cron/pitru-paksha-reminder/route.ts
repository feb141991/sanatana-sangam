import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';
import { canSendInLocalWindow, getLocalDateIso, resolveTimeZone } from '@/lib/sacred-time';
import { getPitruPakshaDay, getPitruPakshaBannerCopy } from '@/lib/pitru-paksha';

// ─── Pitru Paksha Morning Reminder ───────────────────────────────────────────
// Schedule: 0 3 * * * (3 AM UTC = 8:30 AM IST — before the Shraddha window)
//
// Fires every morning at 3 AM UTC. During Pitru Paksha (Sept 19–Oct 4 2026),
// sends ancestor-remembrance notifications to Hindu users only. On other days
// the handler returns immediately with no DB writes.
//
// notification_key "pitru-paksha:<date>" prevents duplicate sends per day.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Check if today is Pitru Paksha before doing any DB work
  const pitruInfo = getPitruPakshaDay(new Date());
  if (!pitruInfo) {
    return NextResponse.json({ message: 'Not in Pitru Paksha window — nothing to do', sent: 0 });
  }

  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const now             = new Date();
    const targetLocalHour = 8; // 8 AM local — before the mid-morning Shraddha window

    // Only target Hindu (and null/unset tradition) users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, tradition, timezone, notification_quiet_hours_start, notification_quiet_hours_end')
      .or('tradition.eq.hindu,tradition.is.null');

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }
    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No Hindu users found', sent: 0 });
    }

    const copy = getPitruPakshaBannerCopy(pitruInfo);

    const eligibleUsers = users.filter((user) => {
      const tz = resolveTimeZone((user as any).timezone);
      return canSendInLocalWindow(
        now,
        tz,
        targetLocalHour,
        (user as any).notification_quiet_hours_start ?? null,
        (user as any).notification_quiet_hours_end ?? null
      );
    });

    if (eligibleUsers.length === 0) {
      return NextResponse.json({ message: 'No users in 8 AM window', sent: 0 });
    }

    const notifications = eligibleUsers.map((u) => {
      const tz        = resolveTimeZone((u as any).timezone);
      const localDate = getLocalDateIso(now, tz);

      return {
        user_id:          u.id,
        title:            pitruInfo.isMahalaya ? '🪔 Mahalaya Amavasya' : `☽ ${copy.title}`,
        body:             copy.subtitle,
        emoji:            pitruInfo.isMahalaya ? '🪔' : '☽',
        type:             'festival' as const,
        action_url:       '/home',
        notification_key: `pitru-paksha:${localDate}`,
        local_date:       localDate,
        sent_timezone:    tz,
      };
    });

    let totalInserted  = 0;
    const insertedIds: string[] = [];
    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      const { data: rows, error: insertErr } = await supabase
        .from('notifications')
        .upsert(batch, { onConflict: 'user_id,notification_key', ignoreDuplicates: true })
        .select('user_id');
      if (insertErr) {
        console.error('[pitru-paksha-reminder] insert error:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      totalInserted += rows?.length ?? 0;
      insertedIds.push(...((rows ?? []).map((r: { user_id: string }) => r.user_id)));
    }

    const baseUrl   = new URL(request.url).origin;
    const actionUrl = new URL('/home', baseUrl).toString();
    const pushResult = await sendOneSignalPush({
      userIds: insertedIds,
      title:   pitruInfo.isMahalaya ? '🪔 Mahalaya Amavasya — today' : `☽ ${copy.title}`,
      body:    copy.subtitle,
      url:     actionUrl,
      data:    { type: 'festival' },
    });

    return NextResponse.json({
      message:      'Pitru Paksha reminders sent',
      day:          pitruInfo.day,
      isMahalaya:   pitruInfo.isMahalaya,
      reminded:     totalInserted,
      push_targets: pushResult.sent,
    });
  } catch (error) {
    console.error('[pitru-paksha-reminder] cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron crashed' },
      { status: 500 }
    );
  }
}
