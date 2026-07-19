import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushNotification } from '@/lib/push-server';
import { buildNotificationSafetyResponse, getNotificationSafetyState } from '@/lib/notification-safety';
import { canSendInLocalWindow, getLocalDateIso, isoDateDiff, resolveTimeZone } from '@/lib/sacred-time';
import {
  buildObservanceActionPath,
  buildObservancePreviewRow,
  buildOccurrenceNotificationKey,
  fetchReviewedObservancesForNotifications,
  filterGeneralOccurrenceBackedVrats,
  filterWomenFocusedVrats,
  type ObservanceNotificationAudience,
  type ObservanceNotificationPreview,
  type ReviewedObservance,
} from '@/lib/observance-notification-source';

// ─── Vrat Reminder Cron ──────────────────────────────────────────────────────
// Sends occurrence-backed reminders for reviewed recurring vrats. General
// observances such as Ekadashi/Pradosh/Purnima/Amavasya are sent to all
// eligible Hindu users; women-focused vrats keep a separate audience branch and
// copy while sharing the same reviewed source, time-window, and dedupe plumbing.

function buildVratReminderBody(
  vratName: string,
  vratDescription: string,
  daysAway: number,
  audience: ObservanceNotificationAudience,
) {
  if (audience === 'female') {
    if (daysAway === 1) {
      return `${vratDescription} Prepare according to your family and sampradaya guidance.`;
    }

    return `${vratName} is one week away. Review the vrat guidance and prepare gently.`;
  }

  if (daysAway === 1) {
    return `${vratDescription} Prepare your sankalpa, meal rhythm, and practice gently.`;
  }

  return `${vratName} is one week away. Review the observance guidance and prepare your practice.`;
}

function buildVratTitle(
  vrat: ReviewedObservance,
  daysAway: number,
  audience: ObservanceNotificationAudience,
) {
  const suffix = daysAway === 1 ? 'Tomorrow!' : 'In 7 days';
  const label = audience === 'female' || /\bvrat\b/i.test(vrat.name) ? vrat.name : `${vrat.name} Vrat`;
  return `${vrat.emoji} ${label} — ${suffix}`;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { isDryRun, skipDelivery, disabledReason } = getNotificationSafetyState('vrat', request);

  try {
    const now = new Date();
    const targetLocalHour = 9;
    const baseUrl = new URL(request.url).origin;
    const previewDays = Math.max(0, Math.min(30, Number(new URL(request.url).searchParams.get('previewDays') ?? 0) || 0));

    const { observances, error: observanceError } = await fetchReviewedObservancesForNotifications(supabase, ['vrat']);
    if (observanceError) {
      console.error('[vrat-reminder] reviewed observances query failed:', observanceError);
      return NextResponse.json({ error: `Reviewed vrat source unavailable: ${observanceError.message}` }, { status: 500 });
    }

    const generalVrats = filterGeneralOccurrenceBackedVrats(observances);
    const femaleVrats = filterWomenFocusedVrats(observances);
    if (generalVrats.length === 0 && femaleVrats.length === 0) {
      return NextResponse.json({ message: 'No reviewed vrat source rows eligible for reminder', sent: 0 });
    }

    if (isDryRun && previewDays > 0) {
      const localDate = getLocalDateIso(now, 'UTC');
      const previewRows: ObservanceNotificationPreview[] = [];

      for (const vrat of generalVrats) {
        const daysAway = isoDateDiff(vrat.date, localDate);
        if (daysAway < 0 || daysAway > previewDays) continue;
        previewRows.push(buildObservancePreviewRow(vrat, 'general', daysAway, localDate));
      }

      for (const vrat of femaleVrats) {
        const daysAway = isoDateDiff(vrat.date, localDate);
        if (daysAway < 0 || daysAway > previewDays) continue;
        previewRows.push(buildObservancePreviewRow(vrat, 'female', daysAway, localDate));
      }

      return NextResponse.json(buildNotificationSafetyResponse('vrat', { isDryRun, isDisabled: false, skipDelivery: true }, {
        wouldSendCount: previewRows.length,
        preview: previewRows.slice(0, 100),
      }));
    }

    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, tradition, gender_context, timezone, wants_festival_reminders, notification_quiet_hours_start, notification_quiet_hours_end')
      .or('tradition.eq.hindu,tradition.is.null');

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
      _push_url: string;
    }> = [];
    const previewRows: ObservanceNotificationPreview[] = [];
    const eligibleUserIds = new Set<string>();

    for (const user of users) {
      if ((user as any).wants_festival_reminders === false) continue;

      const tz = resolveTimeZone((user as any).timezone);
      const localDate = getLocalDateIso(now, tz);

      if (!canSendInLocalWindow(
        now,
        tz,
        targetLocalHour,
        (user as any).notification_quiet_hours_start ?? null,
        (user as any).notification_quiet_hours_end ?? null
      )) continue;

      eligibleUserIds.add(user.id);

      const audienceGroups: Array<{ audience: ObservanceNotificationAudience; vrats: ReviewedObservance[] }> = [
        { audience: 'general', vrats: generalVrats },
      ];

      if ((user as any).gender_context === 'female' || (user as any).gender_context == null) {
        audienceGroups.push({ audience: 'female', vrats: femaleVrats });
      }

      for (const { audience, vrats } of audienceGroups) {
        for (const vrat of vrats) {
          const daysAway = isoDateDiff(vrat.date, localDate);
          if (daysAway !== 1 && daysAway !== 7) continue;

          const title = buildVratTitle(vrat, daysAway, audience);
          const body = buildVratReminderBody(vrat.name, vrat.description, daysAway, audience);
          const actionPath = buildObservanceActionPath(vrat);

          previewRows.push(buildObservancePreviewRow(vrat, audience, daysAway, localDate));
          notifications.push({
            user_id: user.id,
            title,
            body,
            emoji: vrat.emoji,
            type: 'festival',
            action_url: actionPath,
            notification_key: buildOccurrenceNotificationKey(vrat, audience, daysAway, localDate),
            local_date: localDate,
            sent_timezone: tz,
            _push_title: title,
            _push_body: body,
            _push_url: new URL(actionPath, baseUrl).toString(),
          });
        }
      }
    }

    if (notifications.length === 0) {
      return NextResponse.json({ message: 'No vrat reminders due today', sent: 0 });
    }

    if (isDryRun || skipDelivery) {
      return NextResponse.json(buildNotificationSafetyResponse('vrat', { isDryRun, isDisabled: skipDelivery, skipDelivery, disabledReason }, {
        eligibleCount: eligibleUserIds.size,
        skippedCount: users.length - eligibleUserIds.size,
        wouldSendCount: notifications.length,
        preview: previewRows.slice(0, 100),
      }));
    }

    let totalInserted = 0;
    const insertedKeys = new Set<string>();
    const notificationIdsByUserAndKey = new Map<string, string>();

    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      const { data: rows, error: insertErr } = await supabase
        .from('notifications')
        .upsert(batch.map((notification) => {
          const { _push_title, _push_body, _push_url, ...row } = notification;
          return row;
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

    const pushGroups = new Map<string, { title: string; body: string; url: string; userIds: string[]; notificationKeysByUserId: Record<string, string>; notificationIdsByUserId: Record<string, string> }>();
    for (const notification of notifications) {
      const key = `${notification._push_title}::${notification._push_body}::${notification._push_url}`;
      if (!pushGroups.has(key)) {
        pushGroups.set(key, { title: notification._push_title, body: notification._push_body, url: notification._push_url, userIds: [], notificationKeysByUserId: {}, notificationIdsByUserId: {} });
      }

      const insertedKey = `${notification.user_id}:${notification.notification_key}`;
      if (!insertedKeys.has(insertedKey)) continue;

      const group = pushGroups.get(key)!;
      group.userIds.push(notification.user_id);
      group.notificationIdsByUserId[notification.user_id] = notificationIdsByUserAndKey.get(insertedKey)!;
      group.notificationKeysByUserId[notification.user_id] = notification.notification_key;
    }

    let totalPushSent = 0;
    for (const group of pushGroups.values()) {
      if (group.userIds.length === 0) continue;
      const result = await sendPushNotification({
        userIds: group.userIds,
        title: group.title,
        body: group.body,
        url: group.url,
        data: { type: 'festival' },
      }, {
        type: 'vrat',
        notificationKeysByUserId: group.notificationKeysByUserId,
        notificationIdsByUserId: group.notificationIdsByUserId,
      });
      totalPushSent += result.sent;
    }

    return NextResponse.json({
      message: 'Vrat reminders sent',
      reminded: totalInserted,
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
