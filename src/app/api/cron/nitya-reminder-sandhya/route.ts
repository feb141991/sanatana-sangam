import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';
import { canSendInLocalWindow, getLocalDateIso, resolveTimeZone } from '@/lib/sacred-time';

// ─── Nitya Karma Sandhya Reminder Cron ──────────────────────────────────────
// Schedule: runs daily — 1 PM UTC (≈ 6:30 PM IST).
// Finds full-day/advanced users who have NOT completed both evening steps today.

const TARGET_LOCAL_HOUR = 18;

type RhythmMode = 'morning' | 'full_day' | 'advanced';

type NityaReminderUser = {
  id: string;
  full_name: string | null;
  tradition: string | null;
  timezone: string | null;
  wants_evening_reminder: boolean | null;
  nitya_rhythm_mode: RhythmMode | null;
  notification_quiet_hours_start: string | null;
  notification_quiet_hours_end: string | null;
};

type NityaLogRow = {
  user_id: string;
  log_date: string;
  step_id: string | null;
};

type NotificationInsertRow = {
  user_id: string;
  title: string;
  body: string;
  emoji: string;
  type: 'nitya';
  action_url: string;
  notification_key: string;
  local_date: string;
  sent_timezone: string;
};

const TRADITION_NUDGE: Record<string, { title: string; body: string }> = {
  hindu: {
    title: '🪔 Sandhya Diya — the day closes',
    body: 'Light the lamp. Offer the evening prayer. The day returns to the one who gave it.',
  },
  sikh: {
    title: '🪔 Rehras Sahib',
    body: 'The sun is setting. Rehras Sahib closes the day with grace.',
  },
  buddhist: {
    title: '🪔 Evening Sitting',
    body: 'The day is done. 10 minutes before it fully closes.',
  },
  jain: {
    title: '🪔 Sayam Pratikraman',
    body: 'Evening repentance — examine the day before it becomes the past.',
  },
};

function getLocalHour(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now);

  return Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
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

    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, tradition, timezone, wants_evening_reminder, nitya_rhythm_mode, notification_quiet_hours_start, notification_quiet_hours_end')
      .eq('wants_evening_reminder', true)
      .in('nitya_rhythm_mode', ['full_day', 'advanced']);

    if (usersError) {
      console.error('Nitya sandhya cron users query failed:', usersError);
      return NextResponse.json({ error: `Profiles query failed: ${usersError.message}` }, { status: 500 });
    }

    const reminderUsers = (users ?? []) as NityaReminderUser[];
    if (reminderUsers.length === 0) {
      return NextResponse.json({ message: 'No users', sent: 0 });
    }

    // ── Step 1: Timezone window filter (coarse — keeps cron fast) ────────────
    const windowUsers = reminderUsers.filter((user) => {
      const tz = resolveTimeZone(user.timezone);
      if (getLocalHour(now, tz) > 21) return false;
      return canSendInLocalWindow(
        now, tz, TARGET_LOCAL_HOUR,
        user.notification_quiet_hours_start != null ? Number(user.notification_quiet_hours_start) : null,
        user.notification_quiet_hours_end != null ? Number(user.notification_quiet_hours_end) : null,
        2,
      );
    });

    if (windowUsers.length === 0) {
      return NextResponse.json({ message: 'No users in sandhya window', sent: 0 });
    }

    // ── Step 2: Find users who have not completed both evening steps today ───
    const eligibleIds = windowUsers.map(u => u.id);
    const localDates  = new Map<string, string>();
    for (const user of windowUsers) {
      const tz = resolveTimeZone(user.timezone);
      localDates.set(user.id, getLocalDateIso(now, tz));
    }

    const uniqueDates = [...new Set(localDates.values())];
    const { data: logRows } = await supabase
      .from('nitya_karma_log')
      .select('user_id, log_date, step_id')
      .in('user_id', eligibleIds)
      .in('log_date', uniqueDates)
      .in('step_id', ['sandhya_diya_done', 'evening_vandana_done']);

    const completedStepsByUser = new Map<string, Set<string>>();
    for (const row of (logRows ?? []) as NityaLogRow[]) {
      if (row.log_date !== localDates.get(row.user_id) || !row.step_id) continue;
      if (!completedStepsByUser.has(row.user_id)) {
        completedStepsByUser.set(row.user_id, new Set<string>());
      }
      completedStepsByUser.get(row.user_id)!.add(row.step_id);
    }

    const completedUserIds = new Set(
      [...completedStepsByUser.entries()]
        .filter(([, steps]) => steps.has('sandhya_diya_done') && steps.has('evening_vandana_done'))
        .map(([userId]) => userId)
    );

    const uncompletedUsers = windowUsers.filter(u => !completedUserIds.has(u.id));
    if (uncompletedUsers.length === 0) {
      return NextResponse.json({ message: 'All sandhya-window users have already completed', sent: 0 });
    }

    // ── Step 3: Build tradition-aware notifications ─────────────────────────
    const notifications: NotificationInsertRow[] = uncompletedUsers.map((u) => {
      const localDate = getLocalDateIso(now, resolveTimeZone(u.timezone));
      const tradition = u.tradition ?? 'hindu';
      const nudge     = TRADITION_NUDGE[tradition] ?? TRADITION_NUDGE.hindu;

      return {
        user_id:          u.id,
        title:            nudge.title,
        body:             nudge.body,
        emoji:            '🪔',
        type:             'nitya',
        action_url:       actionPath,
        notification_key: `nitya:sandhya:${localDate}`,
        local_date:       localDate,
        sent_timezone:    resolveTimeZone(u.timezone),
      };
    });

    // ── Step 4: Insert + deduplicate ─────────────────────────────────────────
    let totalInserted    = 0;
    const insertedUserIds: string[] = [];

    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      const { data: insertedRows, error: insertError } = await supabase
        .from('notifications')
        .upsert(batch, { onConflict: 'user_id,notification_key', ignoreDuplicates: true })
        .select('user_id');

      if (insertError) {
        console.error('Nitya sandhya cron insert failed:', insertError);
        return NextResponse.json({ error: `Notification insert failed: ${insertError.message}` }, { status: 500 });
      }

      totalInserted += insertedRows?.length ?? 0;
      insertedUserIds.push(...((insertedRows ?? []) as Array<{ user_id: string }>).map((r) => r.user_id));
    }

    // ── Step 5: OneSignal push — grouped by tradition ────────────────────────
    const byTradition = new Map<string, { userIds: string[]; nudge: { title: string; body: string } }>();
    for (const u of uncompletedUsers) {
      if (!insertedUserIds.includes(u.id)) continue;
      const t     = u.tradition ?? 'hindu';
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
      message:      'Nitya sandhya reminders sent',
      eligible:     windowUsers.length,
      uncompleted:  uncompletedUsers.length,
      inserted:     totalInserted,
      push_targets: totalPushTargets,
    });
  } catch (error) {
    console.error('Nitya sandhya cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nitya sandhya cron crashed' },
      { status: 500 }
    );
  }
}
