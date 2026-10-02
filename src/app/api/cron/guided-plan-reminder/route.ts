import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildNotificationSafetyResponse, getNotificationSafetyState } from '@/lib/notification-safety';
import { getNextLocalHourUtc, resolveTimeZone } from '@/lib/sacred-time';
import { enqueueNotificationSchedule } from '@/lib/notification-schedule-queue';
import type { NotificationScheduleDraft } from '@/lib/notification-schedule-queue';
import { getPlanById } from '@/lib/guided-paths';

// ─── Guided Plan Milestone Reminder Cron ─────────────────────────────────────
// Schedule: runs daily at 6 AM UTC.
// Finds users with an active guided plan and queues a day-N nudge into the
// shared cadence dispatcher at their next local 08:00 slot.
//
// Notification key: `guided-plan:{path_id}:day:{day_reached}` — one per day.

const TARGET_LOCAL_HOUR = 8; // 8 AM in user's local timezone

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
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const safetyState = getNotificationSafetyState('guided-plan', request);
  const now      = new Date();

  try {
    // 1. Fetch all active guided plans with user profile info
    const { data: activePlans, error: plansError } = await supabase
      .from('guided_path_progress')
      .select(`
        user_id, path_id, day_reached, updated_at,
        profiles!inner(timezone, tradition, full_name, notification_quiet_hours_start, notification_quiet_hours_end)
      `)
      .eq('status', 'active');

    if (plansError) {
      console.error('Guided plan cron query failed:', plansError);
      return NextResponse.json({ error: plansError.message }, { status: 500 });
    }

    if (!activePlans || activePlans.length === 0) {
      return NextResponse.json({ message: 'No active guided plans', sent: 0 });
    }

    const eligiblePlans = activePlans;

    // 3. Advance day_reached if last update was yesterday, build notifications
    const notifications: NotificationScheduleDraft[] = [];

    for (const row of eligiblePlans as any[]) {
      const tz        = resolveTimeZone(row.profiles?.timezone);
      const { sendAt, localDateIso } = getNextLocalHourUtc(now, tz, TARGET_LOCAL_HOUR, 0);
      const plan      = getPlanById(row.path_id);
      if (!plan) continue;

      const dayReached = row.day_reached ?? 1;
      const dayData    = plan.days.find(d => d.day === dayReached);
      if (!dayData) continue;

      // Build day-specific nudge copy
      const title = `${plan.emoji} Day ${dayReached} — ${dayData.title}`;
      const body   = `Your ${plan.title} practice for today: ${dayData.focus}. ${dayData.duration} minutes. Open to see today's guidance.`;

      notifications.push({
        user_id:          row.user_id,
        title,
        body,
        send_at:          sendAt.toISOString(),
        notification_type: 'guided_plan',
        status:           'pending',
        notification_key: `guided-plan:${row.user_id}:${row.path_id}:day:${dayReached}:${localDateIso}`,
        metadata: {
          emoji: plan.emoji,
          type: 'general',
          action_url: '/nitya-karma/plans',
          path_id: row.path_id,
          day_reached: dayReached,
          timezone: tz,
          local_date: localDateIso,
        },
      });
    }

    if (notifications.length === 0) {
      return NextResponse.json({ message: 'No notifications to send', sent: 0 });
    }

    if (safetyState.isDryRun || safetyState.skipDelivery) {
      return NextResponse.json(buildNotificationSafetyResponse('guided-plan', safetyState, {
        eligibleCount: eligiblePlans.length,
        wouldInsertCount: notifications.length,
        preview: notifications.slice(0, 10).map((notification) => ({
          user_id: notification.user_id,
          title: notification.title,
          notification_key: notification.notification_key,
        })),
      }));
    }

    // 4. Queue with per-user/day cadence admission and idempotency.
    const { queued, ignored } = await enqueueNotificationSchedule(supabase, notifications);

    // NOTE: We do NOT auto-advance day_reached here.
    // Day advancement is exclusively driven by the user tapping "Mark Day Complete"
    // in the app. Auto-advancing on notification send would mark days complete
    // without the user actually doing the practice.

    return NextResponse.json({
      message:      'Guided plan reminders queued',
      active_plans: activePlans.length,
      eligible_plans: eligiblePlans.length,
      inserted:     queued,
      ignored,
    });
  } catch (error) {
    console.error('Guided plan cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Guided plan cron crashed' },
      { status: 500 }
    );
  }
}
