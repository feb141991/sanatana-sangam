import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushNotification } from '@/lib/push-server';
import { buildNotificationSafetyResponse, getNotificationSafetyState } from '@/lib/notification-safety';
import { canSendInLocalWindow, getLocalDateIso, resolveTimeZone } from '@/lib/sacred-time';
import { getPitruPakshaDay, getPitruPakshaBannerCopy } from '@/lib/pitru-paksha';

// ─── Pitru Paksha Morning Reminder ───────────────────────────────────────────
// Schedule: 0 3 * * * (3 AM UTC = 8:30 AM IST — before the Shraddha window)
//
// Fires every morning at 3 AM UTC. During the astronomically derived local
// Pitru Paksha window, sends ancestor-remembrance notifications to Hindu users.
//
// notification_key "pitru-paksha:<date>" prevents duplicate sends per day.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { isDryRun, skipDelivery, disabledReason } = getNotificationSafetyState('pitru_paksha', request);

  try {
    const now             = new Date();
    const targetLocalHour = 8; // 8 AM local — before the mid-morning Shraddha window

    // Only target Hindu (and null/unset tradition) users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, tradition, timezone, latitude, longitude, notification_quiet_hours_start, notification_quiet_hours_end')
      .or('tradition.eq.hindu,tradition.is.null');

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }
    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No Hindu users found', sent: 0 });
    }

    const eligibleUsers = users.flatMap((user) => {
      const tz = resolveTimeZone((user as any).timezone);
      const latitude = (user as any).latitude as number | null;
      const longitude = (user as any).longitude as number | null;
      if (latitude == null || longitude == null) return [];
      if (!canSendInLocalWindow(
        now,
        tz,
        targetLocalHour,
        (user as any).notification_quiet_hours_start ?? null,
        (user as any).notification_quiet_hours_end ?? null
      )) return [];

      const localDate = getLocalDateIso(now, tz);
      const pitruInfo = getPitruPakshaDay(localDate, { lat: latitude, lon: longitude, tz });
      return pitruInfo ? [{ user, localDate, pitruInfo }] : [];
    });

    if (eligibleUsers.length === 0) {
      return NextResponse.json({ message: 'No users in 8 AM window', sent: 0 });
    }

    const notifications = eligibleUsers.map(({ user: u, localDate, pitruInfo }) => {
      const tz = resolveTimeZone((u as any).timezone);
      const copy = getPitruPakshaBannerCopy(pitruInfo);

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

    if (isDryRun || skipDelivery) {
      return NextResponse.json(buildNotificationSafetyResponse('pitru_paksha', { isDryRun, isDisabled: skipDelivery, skipDelivery, disabledReason }, {
        eligibleCount: eligibleUsers.length,
        skippedCount: users.length - eligibleUsers.length,
        wouldSendCount: notifications.length,
      }));
    }

    let totalInserted  = 0;
    const insertedIds: string[] = [];
    const notificationIdsByUserId: Record<string, string> = {};
    const notificationKeysByUserId: Record<string, string> = {};
    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      const { data: rows, error: insertErr } = await supabase
        .from('notifications')
        .upsert(batch, { onConflict: 'user_id,notification_key', ignoreDuplicates: true })
        .select('id, user_id, notification_key');
      if (insertErr) {
        console.error('[pitru-paksha-reminder] insert error:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      totalInserted += rows?.length ?? 0;
      for (const row of rows ?? []) {
        insertedIds.push(row.user_id);
        notificationIdsByUserId[row.user_id] = row.id;
        notificationKeysByUserId[row.user_id] = row.notification_key;
      }
    }

    const baseUrl   = new URL(request.url).origin;
    const actionUrl = new URL('/home', baseUrl).toString();
    const insertedIdSet = new Set(insertedIds);
    const pushGroups = new Map<string, typeof eligibleUsers>();
    for (const eligible of eligibleUsers) {
      if (!insertedIdSet.has(eligible.user.id)) continue;
      const key = `${eligible.pitruInfo.day}:${eligible.pitruInfo.isMahalaya}`;
      pushGroups.set(key, [...(pushGroups.get(key) ?? []), eligible]);
    }

    let pushTargets = 0;
    for (const group of pushGroups.values()) {
      const info = group[0].pitruInfo;
      const groupCopy = getPitruPakshaBannerCopy(info);
      const userIds = group.map(({ user }) => user.id);
      const pushResult = await sendPushNotification({
        userIds,
        title: info.isMahalaya ? '🪔 Mahalaya Amavasya — today' : `☽ ${groupCopy.title}`,
        body: groupCopy.subtitle,
        url: actionUrl,
        data: { type: 'festival' },
      }, {
        type: 'pitru_paksha',
        notificationKeysByUserId: Object.fromEntries(userIds.map((id) => [id, notificationKeysByUserId[id]])),
        notificationIdsByUserId: Object.fromEntries(userIds.map((id) => [id, notificationIdsByUserId[id]])),
      });
      pushTargets += pushResult.sent;
    }

    return NextResponse.json({
      message:      'Pitru Paksha reminders sent',
      local_days:   [...new Set(eligibleUsers.map(({ pitruInfo }) => pitruInfo.day))],
      mahalaya:     eligibleUsers.some(({ pitruInfo }) => pitruInfo.isMahalaya),
      reminded:     totalInserted,
      push_targets: pushTargets,
    });
  } catch (error) {
    console.error('[pitru-paksha-reminder] cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron crashed' },
      { status: 500 }
    );
  }
}
