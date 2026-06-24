import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';
import { buildNotificationSafetyResponse, getNotificationSafetyState } from '@/lib/notification-safety';
import { getLocalDateIso, resolveTimeZone } from '@/lib/sacred-time';

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

export async function GET(request: Request) {
  // Auth
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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

    let eligibleCount = 0;
    let wouldInsertCount = 0;
    const notificationsToInsert: JapaNotificationInsert[] = [];
    const userIdsToPush: string[] = [];

    for (const user of users || []) {
      const tz = resolveTimeZone(user.timezone);
      const localDate = getLocalDateIso(now, tz);

      const { data: sadhana } = await supabase
        .from('daily_sadhana')
        .select('japa_done')
        .eq('user_id', user.id)
        .eq('date', localDate)
        .maybeSingle();

      if (sadhana?.japa_done) continue;
      eligibleCount++;

      const title = '🔔 Time for Japa';
      const body = "Your daily Japa practice awaits. Keep your streak alive 🙏";

      notificationsToInsert.push({
        user_id: user.id,
        title,
        body,
        emoji: '🔔',
        type: 'japa',
        action_url: '/japa',
        notification_key: `japa-reminder:${localDate}`,
        local_date: localDate,
        sent_timezone: tz,
      });
      wouldInsertCount++;
      userIdsToPush.push(user.id);
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

    const pushResult = await sendOneSignalPush({
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
