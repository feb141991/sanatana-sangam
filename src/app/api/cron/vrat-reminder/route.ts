import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushNotification } from '@/lib/push-server';
import { buildNotificationSafetyResponse, getNotificationSafetyState } from '@/lib/notification-safety';
import { canSendInLocalWindow, getLocalDateIso, isoDateDiff, resolveTimeZone } from '@/lib/sacred-time';
import { fetchReviewedObservancesForNotifications, filterWomenFocusedVrats } from '@/lib/observance-notification-source';

// ─── Gender-Specific Vrat Reminder Cron ──────────────────────────────────────
// Schedule: 0 7 * * * (same morning window as festival-reminder)
//
// Sends personalized reminders to female Hindu users for vrats that are
// traditionally observed by women. Uses warmer, more intimate copy than the
// generic festival cron.
//
// Targeting criteria:
//   tradition = 'hindu' (or null)
//   gender_context = 'female' (or null — we include null to avoid missing users
//                                who haven't filled their profile yet)
//
// The notification_key "vrat-female:<observance_id>:<days>:<date>" keeps these
// distinct from the generic festival-reminder messages on the same day.
// ─────────────────────────────────────────────────────────────────────────────

function buildVratReminderBody(vratName: string, vratDescription: string, daysAway: number) {
  if (daysAway === 1) {
    return `${vratDescription} Prepare according to your family and sampradaya guidance.`;
  }

  return `${vratName} is one week away. Review the vrat guidance and prepare gently.`;
}

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
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { isDryRun, skipDelivery, disabledReason } = getNotificationSafetyState('vrat', request);

  try {
    const now             = new Date();
    const targetLocalHour = 9;
    const actionPath      = '/home?focus=festivals';
    const baseUrl         = new URL(request.url).origin;
    const actionUrl       = new URL(actionPath, baseUrl).toString();
    const { observances, error: observanceError } = await fetchReviewedObservancesForNotifications(supabase, ['vrat']);
    if (observanceError) {
      console.error('[vrat-reminder] reviewed observances query failed:', observanceError);
      return NextResponse.json({ error: `Reviewed vrat source unavailable: ${observanceError.message}` }, { status: 500 });
    }

    const femaleVrats = filterWomenFocusedVrats(observances);
    if (femaleVrats.length === 0) {
      return NextResponse.json({ message: 'No reviewed women-focused vrat source rows eligible for reminder', sent: 0 });
    }

    // Target Hindu female users (or those with unset gender)
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, tradition, gender_context, timezone, notification_quiet_hours_start, notification_quiet_hours_end')
      .or('tradition.eq.hindu,tradition.is.null')
      .or('gender_context.eq.female,gender_context.is.null');

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }
    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No target users found', sent: 0 });
    }

    const notifications: Array<{
      user_id: string;
      title: string;
      body: string;
      emoji: string;
      type: 'festival';
      action_url: string;
      notification_key: string;
      local_date: string;
      sent_timezone: string;
      _push_title: string;
      _push_body: string;
    }> = [];

    for (const user of users) {
      const tz        = resolveTimeZone((user as any).timezone);
      const localDate = getLocalDateIso(now, tz);

      if (!canSendInLocalWindow(
        now,
        tz,
        targetLocalHour,
        (user as any).notification_quiet_hours_start ?? null,
        (user as any).notification_quiet_hours_end ?? null
      )) continue;

      for (const vrat of femaleVrats) {
        const daysAway = isoDateDiff(vrat.date, localDate);
        if (daysAway !== 1 && daysAway !== 7) continue;

        const title = daysAway === 1
          ? `${vrat.emoji} ${vrat.name} — Tomorrow!`
          : `${vrat.emoji} ${vrat.name} — In 7 days`;
        const body  = buildVratReminderBody(vrat.name, vrat.description, daysAway);

        notifications.push({
          user_id:          user.id,
          title,
          body,
          emoji:            vrat.emoji,
          type:             'festival',
          action_url:       actionPath,
          notification_key: `vrat-female:${vrat.id ?? vrat.slug ?? vrat.name}:${daysAway}:${localDate}`,
          local_date:       localDate,
          sent_timezone:    tz,
          _push_title:      title,
          _push_body:       body,
        });
      }
    }

    if (notifications.length === 0) {
      return NextResponse.json({ message: 'No vrat reminders due today', sent: 0 });
    }

    if (isDryRun || skipDelivery) {
      return NextResponse.json(buildNotificationSafetyResponse('vrat', { isDryRun, isDisabled: skipDelivery, skipDelivery, disabledReason }, {
        eligibleCount: users.length,
        skippedCount: 0,
        wouldSendCount: notifications.length,
      }));
    }

    let totalInserted  = 0;
    const insertedKeys = new Set<string>();
    const notificationIdsByUserAndKey = new Map<string, string>();
    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      const { data: rows, error: insertErr } = await supabase
        .from('notifications')
        .upsert(batch.map((n) => {
          // Exclude internal _push_title and _push_body from DB insert
          const { _push_title, _push_body, ...rest } = n;
          return rest;
        }), { onConflict: 'user_id,notification_key', ignoreDuplicates: true })
        .select('id, user_id, notification_key');

      if (insertErr) {
        console.error('[vrat-reminder] insert error:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      totalInserted += rows?.length ?? 0;
      for (const row of rows ?? []) {
        const insertedKey = `${row.user_id}:${row.notification_key}`;
        insertedKeys.add(insertedKey);
        notificationIdsByUserAndKey.set(insertedKey, row.id);
      }
    }

    // Group pushes by unique title+body combination
    const pushGroups = new Map<string, { title: string; body: string; userIds: string[]; notificationKeysByUserId: Record<string, string>; notificationIdsByUserId: Record<string, string> }>();
    for (const n of notifications) {
      const key = `${n._push_title}::${n._push_body}`;
      if (!pushGroups.has(key)) {
        pushGroups.set(key, { title: n._push_title, body: n._push_body, userIds: [], notificationKeysByUserId: {}, notificationIdsByUserId: {} });
      }
      const insertedKey = `${n.user_id}:${n.notification_key}`;
      // Only push to users who actually got an insert, preserving the exact DB row id.
      if (insertedKeys.has(insertedKey)) {
        const group = pushGroups.get(key)!;
        group.userIds.push(n.user_id);
        group.notificationIdsByUserId[n.user_id] = notificationIdsByUserAndKey.get(insertedKey)!;
        group.notificationKeysByUserId[n.user_id] = n.notification_key;
      }
    }

    let totalPushSent = 0;
    for (const group of pushGroups.values()) {
      if (group.userIds.length === 0) continue;
      const result = await sendPushNotification({
        userIds: group.userIds,
        title:   group.title,
        body:    group.body,
        url:     actionUrl,
        data:    { type: 'festival' },
      }, { 
        type: 'vrat',
        notificationKeysByUserId: group.notificationKeysByUserId,
        notificationIdsByUserId: group.notificationIdsByUserId,
      });
      totalPushSent += result.sent;
    }

    return NextResponse.json({
      message:      'Vrat reminders sent',
      reminded:     totalInserted,
      push_targets: totalPushSent,
    });
  } catch (error) {
    console.error('[vrat-reminder] cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron crashed' },
      { status: 500 }
    );
  }
}
