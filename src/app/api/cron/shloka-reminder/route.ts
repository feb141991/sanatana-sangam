import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';
import { canSendInLocalWindow, getLocalDateIso, resolveTimeZone } from '@/lib/sacred-time';

// ─── Shloka Streak Reminder Cron ─────────────────────────────────────────────
// Schedule: 0 18 * * * (daily on Vercel Hobby — route still filters by user local evening)
// Finds users who have NOT read today's shloka in their local date window.
// Inserts a gentle reminder notification for each of them.

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Supabase cron environment is missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const baseUrl = new URL(request.url).origin;
    const actionPath = '/home?focus=shloka';
    const actionUrl = new URL(actionPath, baseUrl).toString();
    const now = new Date();
    const targetLocalHour = 19;

    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, shloka_streak, full_name, timezone, last_shloka_date, wants_shloka_reminders, notification_quiet_hours_start, notification_quiet_hours_end');

    if (usersError) {
      console.error('Shloka cron users query failed:', usersError);
      return NextResponse.json(
        { error: `Profiles query failed: ${usersError.message}` },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'All users have read today\'s shloka', sent: 0 });
    }

    const eligibleUsers = users.filter((user) => {
      const timeZone = resolveTimeZone((user as any).timezone);
      if ((user as any).wants_shloka_reminders === false) return false;
      if (!canSendInLocalWindow(
        now,
        timeZone,
        targetLocalHour,
        (user as any).notification_quiet_hours_start ?? null,
        (user as any).notification_quiet_hours_end ?? null
      )) return false;
      const localDate = getLocalDateIso(now, timeZone);
      return !user.last_shloka_date || user.last_shloka_date !== localDate;
    });

    if (eligibleUsers.length === 0) {
      return NextResponse.json({ message: 'No users in the local reminder window', sent: 0 });
    }

    const notifications = eligibleUsers.map((u) => {
      const timeZone = resolveTimeZone((u as any).timezone);
      const localDate = getLocalDateIso(now, timeZone);
      const streak = u.shloka_streak ?? 0;
      const streakMsg = streak > 0
        ? `Don't break your ${streak}-day streak! 🔥`
        : 'Start your shloka journey today 🌱';
      return {
        user_id:    u.id,
        title:      '🕉️ Aaj Ka Shloka awaits',
        body:       `${streakMsg} Take a moment for today's shloka and earn +5 seva points.`,
        emoji:      '🕉️',
        type:       'streak',
        action_url: actionPath,
        notification_key: `streak:${localDate}`,
        local_date: localDate,
        sent_timezone: timeZone,
      };
    });

    let totalInserted = 0;
    const insertedUserIds: string[] = [];
    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      const { data: insertedRows, error: insertError } = await supabase
        .from('notifications')
        .upsert(batch, { onConflict: 'user_id,notification_key', ignoreDuplicates: true })
        .select('user_id');

      if (insertError) {
        console.error('Shloka cron notification insert failed:', insertError);
        return NextResponse.json(
          { error: `Notification insert failed: ${insertError.message}` },
          { status: 500 }
        );
      }

      totalInserted += insertedRows?.length ?? 0;
      insertedUserIds.push(...((insertedRows ?? []).map((row: { user_id: string }) => row.user_id)));
    }

    const pushResult = await sendOneSignalPush({
      userIds: insertedUserIds,
      title: 'Aaj Ka Shloka awaits',
      body: 'Take a quiet moment for today\'s sacred text and keep your practice flowing.',
      url: actionUrl,
      data: {
        type: 'streak',
      },
    });

    return NextResponse.json({
      message:  'Shloka reminders sent',
      reminded: totalInserted,
      push_targets: pushResult.sent,
    });
  } catch (error) {
    console.error('Shloka cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Shloka cron crashed' },
      { status: 500 }
    );
  }
}
