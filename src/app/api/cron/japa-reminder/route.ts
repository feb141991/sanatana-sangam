import { resolveNotificationCopy } from '@/lib/notification-templates';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushNotification } from '@/lib/push-server';
import { buildNotificationSafetyResponse, getNotificationSafetyState } from '@/lib/notification-safety';
import { getLocalDateIso, resolveTimeZone } from '@/lib/sacred-time';

export const dynamic = 'force-dynamic';

type JapaNotificationInsert = {
  user_id: string;
  title: string;
  body: string;
  emoji: string;
  type: 'japa';
  action_url: string;
  notification_key: string;
  local_date: string;
  sent_timezone: string;
};

type UserDateGroup = {
  id: string;
  tz: string;
  localDate: string;
};

export async function GET(request: Request) {
  // Auth
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const { isDryRun, skipDelivery, disabledReason } = getNotificationSafetyState('japa', request);
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const now = new Date();

  try {
    // Fetch all users with japa reminders enabled
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, timezone')
      .eq('japa_reminder_enabled', true);

    if (usersError) throw usersError;

    // Group users by their computed localDate (accounts for different user timezones)
    const groupsByDate = new Map<string, UserDateGroup[]>();
    for (const user of users || []) {
      const tz = resolveTimeZone(user.timezone);
      const localDate = getLocalDateIso(now, tz);
      const group = groupsByDate.get(localDate) ?? [];
      group.push({ id: user.id, tz, localDate });
      groupsByDate.set(localDate, group);
    }

    let eligibleCount = 0;
    let wouldInsertCount = 0;
    const notificationsToInsert: JapaNotificationInsert[] = [];
    const userIdsToPush: string[] = [];

    // Run one batched query per distinct localDate group (turns N sequential queries into 1-3 batched queries)
    for (const [groupLocalDate, groupUsers] of groupsByDate.entries()) {
      const groupUserIds = groupUsers.map((u) => u.id);

      const { data: sadhanaRows, error: sadhanaErr } = await supabase
        .from('daily_sadhana')
        .select('user_id, japa_done')
        .in('user_id', groupUserIds)
        .eq('date', groupLocalDate);

      if (sadhanaErr) {
        console.warn(`[japa-reminder] sadhana batch fetch warning for date ${groupLocalDate}:`, sadhanaErr.message);
      }

      const completedUserIds = new Set(
        (sadhanaRows ?? []).filter((r) => r.japa_done).map((r) => r.user_id),
      );

      for (const user of groupUsers) {
        if (completedUserIds.has(user.id)) continue;
        eligibleCount++;

        const { title, body } = await resolveNotificationCopy('japa', 'all', {
          title: '🔔 Time for Japa',
          body: "Your daily Japa practice awaits. Keep your streak alive 🙏",
        });

        notificationsToInsert.push({
          user_id: user.id,
          title,
          body,
          emoji: '🔔',
          type: 'japa',
          action_url: '/japa',
          notification_key: `japa-reminder:${user.localDate}`,
          local_date: user.localDate,
          sent_timezone: user.tz,
        });
        wouldInsertCount++;
        userIdsToPush.push(user.id);
      }
    }

    if (isDryRun || skipDelivery) {
      return NextResponse.json(buildNotificationSafetyResponse('japa', { isDryRun, isDisabled: skipDelivery, skipDelivery, disabledReason }, {
        eligibleCount,
        skippedCount: (users?.length ?? 0) - eligibleCount,
        wouldInsertCount,
        wouldSendCount: userIdsToPush.length,
      }));
    }

    if (notificationsToInsert.length === 0) {
      return NextResponse.json({ success: true, message: 'No eligible users to notify', notified_users: [] });
    }

    // Insert to notifications table
    let totalInserted = 0;
    const insertedIds: string[] = [];
    const notificationIdsByUserId: Record<string, string> = {};
    for (let i = 0; i < notificationsToInsert.length; i += 100) {
      const batch = notificationsToInsert.slice(i, i + 100);
      const { data: rows, error: insertErr } = await supabase
        .from('notifications')
        .upsert(batch, { onConflict: 'user_id,notification_key', ignoreDuplicates: true })
        .select('id, user_id');
        
      if (insertErr) {
        console.error('[japa-reminder] insert error:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      totalInserted += rows?.length ?? 0;
      for (const row of rows ?? []) {
        insertedIds.push(row.user_id);
        notificationIdsByUserId[row.user_id] = row.id;
      }
    }

    const pushResult = await sendPushNotification({
      userIds: insertedIds,
      title: '🔔 Time for Japa',
      body: "Your daily Japa practice awaits. Keep your streak alive 🙏",
      url: new URL('/japa', new URL(request.url).origin).toString(),
      data: { type: 'japa' },
    }, {
      notificationKey: 'japa-reminder',
      notificationIdsByUserId,
    });

    return NextResponse.json({
      success: true,
      eligibleCount,
      totalInserted,
      pushTargets: pushResult.sent,
    });
  } catch (err) {
    console.error('Japa reminder cron error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Cron crashed' },
      { status: 500 }
    );
  }
}
