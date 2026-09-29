import { resolveNotificationCopy } from '@/lib/notification-templates';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushNotification } from '@/lib/push-server';
import { buildNotificationSafetyResponse, getNotificationSafetyState } from '@/lib/notification-safety';
import { localSpiritualDate, resolveTimeZone } from '@/lib/sacred-time';
import { getRoutinePipelineMode } from '@/lib/notification-candidate-pipeline-mode';
import {
  getCompletedJapaUserIds,
  planNextJapaReminder,
  produceJapaCandidate,
} from '@/lib/japa-candidate-producer';
import type { NotificationCandidateInsert } from '@/types/database';

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
  japa_reminder_time?: string | null;
  notification_quiet_hours_start?: number | null;
  notification_quiet_hours_end?: number | null;
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

  // Pipeline Mode check: legacy | candidate | disabled
  const pipelineMode = getRoutinePipelineMode('japa');
  if (pipelineMode === 'disabled') {
    return NextResponse.json({
      ok: true,
      skipped: true,
      pipeline_mode: 'disabled',
      reason: 'japa_reminders_disabled_by_policy',
    });
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
      .select('id, timezone, japa_reminder_enabled, japa_reminder_time, notification_quiet_hours_start, notification_quiet_hours_end')
      .eq('japa_reminder_enabled', true);

    if (usersError) throw usersError;

    // Candidate mode schedules each user's next future local slot. Group by
    // that target date so completion checks use the same date as delivery.
    if (pipelineMode === 'candidate') {
      const plannedUsers = (users ?? []).flatMap((user) => {
        const plan = planNextJapaReminder({
          id: user.id,
          timezone: user.timezone,
          japa_reminder_enabled: user.japa_reminder_enabled,
          japa_reminder_time: user.japa_reminder_time,
          notification_quiet_hours_start: user.notification_quiet_hours_start,
          notification_quiet_hours_end: user.notification_quiet_hours_end,
        }, now);
        return plan ? [{ user, plan }] : [];
      });
      const plannedByDate = new Map<string, typeof plannedUsers>();
      for (const planned of plannedUsers) {
        const group = plannedByDate.get(planned.plan.completionDate) ?? [];
        group.push(planned);
        plannedByDate.set(planned.plan.completionDate, group);
      }

      const candidateRowsToInsert: NotificationCandidateInsert[] = [];
      let eligibleCount = 0;
      for (const [localDate, group] of plannedByDate) {
        const completedUserIds = await getCompletedJapaUserIds(
          supabase,
          group.map(({ user }) => user.id),
          localDate
        );

        for (const { user, plan } of group) {
          if (completedUserIds.has(user.id)) continue;
          eligibleCount++;
          const { title, body } = await resolveNotificationCopy('japa', 'all', {
            title: '🔔 Time for Japa',
            body: "Your daily Japa practice awaits. Keep your streak alive 🙏",
          });
          const candidate = produceJapaCandidate({
            id: user.id,
            timezone: user.timezone,
            japa_reminder_enabled: user.japa_reminder_enabled,
            japa_reminder_time: user.japa_reminder_time,
            notification_quiet_hours_start: user.notification_quiet_hours_start,
            notification_quiet_hours_end: user.notification_quiet_hours_end,
          }, plan, false, { title, body });
          if (candidate) candidateRowsToInsert.push(candidate);
        }
      }

      if (isDryRun || skipDelivery) {
        return NextResponse.json(buildNotificationSafetyResponse('japa', { isDryRun, isDisabled: skipDelivery, skipDelivery, disabledReason }, {
          eligibleCount,
          skippedCount: (users?.length ?? 0) - eligibleCount,
          wouldInsertCount: candidateRowsToInsert.length,
          wouldSendCount: 0,
        }));
      }

      if (candidateRowsToInsert.length === 0) {
        return NextResponse.json({
          success: true,
          pipeline_mode: 'candidate',
          message: 'No eligible users to notify',
          candidates_created: 0,
        });
      }

      let totalInserted = 0;
      for (let i = 0; i < candidateRowsToInsert.length; i += 100) {
        const batch = candidateRowsToInsert.slice(i, i + 100);
        const { data: rows, error: insertErr } = await supabase
          .from('notification_candidates')
          .upsert(batch, {
            onConflict: 'user_id,event_type,event_id,event_instance,local_date,audience_variant',
            ignoreDuplicates: true,
          })
          .select('id');

        if (insertErr) {
          console.error('[japa-reminder] candidate upsert error:', insertErr);
          return NextResponse.json({ error: insertErr.message }, { status: 500 });
        }
        totalInserted += rows?.length ?? 0;
      }

      return NextResponse.json({
        success: true,
        pipeline_mode: 'candidate',
        eligibleCount,
        candidatesCreated: totalInserted,
      });
    }

    // Legacy direct-send behavior remains isolated behind its own pipeline mode.
    // Japa completion is recorded against the app's 04:00 spiritual-day date.
    const groupsByDate = new Map<string, UserDateGroup[]>();
    for (const user of users || []) {
      const tz = resolveTimeZone(user.timezone);
      const spiritualDate = localSpiritualDate(tz, 4, now);
      const group = groupsByDate.get(spiritualDate) ?? [];
      group.push({
        id: user.id,
        tz,
        localDate: spiritualDate,
        japa_reminder_time: user.japa_reminder_time,
        notification_quiet_hours_start: user.notification_quiet_hours_start,
        notification_quiet_hours_end: user.notification_quiet_hours_end,
      });
      groupsByDate.set(spiritualDate, group);
    }

    let eligibleCount = 0;
    let wouldInsertCount = 0;
    const legacyNotificationsToInsert: JapaNotificationInsert[] = [];
    const userIdsToPush: string[] = [];

    // Run one batched query per distinct localDate group
    for (const [groupLocalDate, groupUsers] of groupsByDate.entries()) {
      const groupUserIds = groupUsers.map((u) => u.id);

      const completedUserIds = await getCompletedJapaUserIds(supabase, groupUserIds, groupLocalDate);

      for (const user of groupUsers) {
        if (completedUserIds.has(user.id)) continue;
        eligibleCount++;

        const { title, body } = await resolveNotificationCopy('japa', 'all', {
          title: '🔔 Time for Japa',
          body: "Your daily Japa practice awaits. Keep your streak alive 🙏",
        });

        legacyNotificationsToInsert.push({
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

    // ─── LEGACY PIPELINE PATH ────────────────────────────────────────────────
    if (legacyNotificationsToInsert.length === 0) {
      return NextResponse.json({ success: true, message: 'No eligible users to notify', notified_users: [] });
    }

    // Insert to notifications table
    let totalInserted = 0;
    const insertedIds: string[] = [];
    const notificationIdsByUserId: Record<string, string> = {};
    for (let i = 0; i < legacyNotificationsToInsert.length; i += 100) {
      const batch = legacyNotificationsToInsert.slice(i, i + 100);
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
      pipeline_mode: 'legacy',
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
