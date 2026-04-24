import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';
import { canSendInLocalWindow, getLocalDateIso, resolveTimeZone } from '@/lib/sacred-time';
import { getPlanById } from '@/lib/guided-paths';

// ─── Guided Plan Milestone Reminder Cron ─────────────────────────────────────
// Schedule: runs daily at 6 AM UTC.
// Finds users with an active guided plan and sends a day-N nudge push if they
// haven't already received one for today. Skips users with no push tokens.
//
// Notification key: `guided-plan:{path_id}:day:{day_reached}` — one per day.

const TARGET_LOCAL_HOUR = 8; // 8 AM in user's local timezone

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
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const now      = new Date();
  const actionUrl = new URL('/nitya-karma/plans', new URL(request.url).origin).toString();

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

    // 2. Filter to users in morning window
    const windowPlans = activePlans.filter((row: any) => {
      const tz = resolveTimeZone(row.profiles?.timezone);
      return canSendInLocalWindow(
        now, tz, TARGET_LOCAL_HOUR,
        row.profiles?.notification_quiet_hours_start ?? null,
        row.profiles?.notification_quiet_hours_end ?? null,
        2,
      );
    });

    if (windowPlans.length === 0) {
      return NextResponse.json({ message: 'No plans in morning window', sent: 0 });
    }

    // 3. Advance day_reached if last update was yesterday, build notifications
    const notifications: {
      user_id: string; title: string; body: string; emoji: string;
      type: string; action_url: string; notification_key: string;
      local_date: string; sent_timezone: string;
    }[] = [];

    for (const row of windowPlans as any[]) {
      const tz        = resolveTimeZone(row.profiles?.timezone);
      const localDate = getLocalDateIso(now, tz);
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
        emoji:            plan.emoji,
        type:             'guided-plan',
        action_url:       '/nitya-karma/plans',
        notification_key: `guided-plan:${row.path_id}:day:${dayReached}:${localDate}`,
        local_date:       localDate,
        sent_timezone:    tz,
      });
    }

    if (notifications.length === 0) {
      return NextResponse.json({ message: 'No notifications to send', sent: 0 });
    }

    // 4. Insert with deduplication
    let totalInserted    = 0;
    const insertedUserIds: string[] = [];

    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      const { data: insertedRows, error: insertError } = await supabase
        .from('notifications')
        .upsert(batch, { onConflict: 'user_id,notification_key', ignoreDuplicates: true })
        .select('user_id');

      if (insertError) {
        console.error('Guided plan cron insert failed:', insertError);
        continue;
      }

      totalInserted += insertedRows?.length ?? 0;
      insertedUserIds.push(...(insertedRows ?? []).map((r: { user_id: string }) => r.user_id));
    }

    // 5. Send OneSignal pushes
    const toSend = notifications.filter(n => insertedUserIds.includes(n.user_id));
    let totalPushTargets = 0;

    for (const notif of toSend) {
      const pushResult = await sendOneSignalPush({
        userIds: [notif.user_id],
        title:   notif.title,
        body:    notif.body,
        url:     actionUrl,
        data:    { type: 'guided-plan', path_id: (windowPlans as any[]).find((r: any) => r.user_id === notif.user_id)?.path_id },
      });
      totalPushTargets += pushResult.sent;
    }

    // 6. Advance day_reached for users who received today's notification
    // (increment by 1, cap at plan.days.length, mark completed if done)
    for (const row of windowPlans as any[]) {
      if (!insertedUserIds.includes(row.user_id)) continue;
      const plan   = getPlanById(row.path_id);
      if (!plan) continue;
      const nextDay = (row.day_reached ?? 1) + 1;
      const newStatus = nextDay > plan.days.length ? 'completed' : 'active';
      await supabase
        .from('guided_path_progress')
        .update({
          day_reached:  Math.min(nextDay, plan.days.length),
          status:       newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
          updated_at:   new Date().toISOString(),
        })
        .eq('user_id', row.user_id)
        .eq('path_id', row.path_id);
    }

    return NextResponse.json({
      message:      'Guided plan reminders sent',
      active_plans: activePlans.length,
      window_plans: windowPlans.length,
      inserted:     totalInserted,
      push_targets: totalPushTargets,
    });
  } catch (error) {
    console.error('Guided plan cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Guided plan cron crashed' },
      { status: 500 }
    );
  }
}
