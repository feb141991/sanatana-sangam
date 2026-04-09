import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';
import { canSendInLocalWindow, getLocalDateIso, isoDateDiff, resolveTimeZone } from '@/lib/sacred-time';

function buildFestivalReminderBody(tradition: string | null | undefined, festivalName: string, festivalDescription: string, festivalDate: string, daysAway: number) {
  const tomorrowTailByTradition: Record<string, string> = {
    hindu: 'Prepare your darshan, observance, and family rhythm.',
    sikh: 'Plan your gurudwara visit, seva, or family remembrance.',
    buddhist: 'Plan your reflection, prayer, or community observance.',
    jain: 'Plan your darshan, pratikraman, or family observance.',
    all: 'Set aside a little time to remember and prepare well.',
  };

  if (daysAway === 1) {
    return `${festivalDescription}. ${tomorrowTailByTradition[tradition ?? 'all'] ?? tomorrowTailByTradition.all}`;
  }

  return `${festivalName} is coming up on ${new Date(festivalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}. Set aside a little time to prepare well.`;
}

// ─── Festival Reminder Cron ───────────────────────────────────────────────────
// Schedule: 0 * * * * (hourly — sends near the user's local morning)
// Checks if any festival is exactly 7 days or 1 day away in the user's local date.
// Sends only tradition-relevant or shared festivals.
// The bell dropdown in TopBar.tsx reads from this notifications table.

export async function GET(request: Request) {
  // Verify this is called by Vercel cron (not a random request)
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
    const actionPath = '/home?focus=festivals';
    const actionUrl = new URL(actionPath, baseUrl).toString();
    const now = new Date();
    const targetLocalHour = 9;

    const { data: festivals, error: festivalsError } = await supabase
      .from('festivals')
      .select('*')
      .order('date', { ascending: true });

    if (festivalsError) {
      console.error('Festival cron festivals query failed:', festivalsError);
      return NextResponse.json(
        { error: `Festival query failed: ${festivalsError.message}` },
        { status: 500 }
      );
    }

    if (!festivals || festivals.length === 0) {
      return NextResponse.json({ message: 'No festivals due for reminder', sent: 0 });
    }

    // Fetch all user IDs
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, tradition, timezone, wants_festival_reminders, notification_quiet_hours_start, notification_quiet_hours_end');

    if (usersError) {
      console.error('Festival cron users query failed:', usersError);
      return NextResponse.json(
        { error: `Profiles query failed: ${usersError.message}` },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users', sent: 0 });
    }

    const eligibleUsers = users.filter((user) => {
      const timeZone = resolveTimeZone((user as any).timezone);
      if ((user as any).wants_festival_reminders === false) return false;
      return canSendInLocalWindow(
        now,
        timeZone,
        targetLocalHour,
        (user as any).notification_quiet_hours_start ?? null,
        (user as any).notification_quiet_hours_end ?? null
      );
    });

    if (eligibleUsers.length === 0) {
      return NextResponse.json({ message: 'No users in the local reminder window', sent: 0 });
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
      festival_id: string;
    }> = [];

    for (const user of eligibleUsers) {
      const timeZone = resolveTimeZone((user as any).timezone);
      const localDate = getLocalDateIso(now, timeZone);
      const userTradition = (user as any).tradition ?? null;

      for (const festival of festivals) {
        const festivalTradition = (festival as any).tradition ?? null;
        const isRelevantTradition = !userTradition
          || !festivalTradition
          || festivalTradition === 'all'
          || festivalTradition === userTradition;
        if (!isRelevantTradition) continue;

        const daysAway = isoDateDiff(festival.date, localDate);
        if (daysAway !== 1 && daysAway !== 7) continue;

        notifications.push({
          user_id: user.id,
          title: daysAway === 1
            ? `${festival.emoji} ${festival.name} — Tomorrow!`
            : `${festival.emoji} ${festival.name} — In 7 days`,
          body: buildFestivalReminderBody(festivalTradition, festival.name, festival.description, festival.date, daysAway),
          emoji: festival.emoji,
          type: 'festival',
          action_url: actionPath,
          notification_key: `festival:${festival.id}:${daysAway}:${localDate}`,
          local_date: localDate,
          sent_timezone: timeZone,
          festival_id: String(festival.id ?? ''),
        });
      }
    }

    if (notifications.length === 0) {
      return NextResponse.json({ message: 'No festivals due in local reminder windows', sent: 0 });
    }

    let totalInserted = 0;
    let totalPushTargets = 0;

    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      const { data: insertedRows, error: insertError } = await supabase
        .from('notifications')
        .upsert(batch.map(({ festival_id: _festivalId, ...notification }) => notification), {
          onConflict: 'user_id,notification_key',
          ignoreDuplicates: true,
        })
        .select('user_id, title, body, notification_key');

      if (insertError) {
        console.error('Festival cron notification insert failed:', insertError);
        return NextResponse.json(
          { error: `Notification insert failed: ${insertError.message}` },
          { status: 500 }
        );
      }

      totalInserted += insertedRows?.length ?? 0;

      const pushBatches = new Map<string, { title: string; body: string; userIds: string[]; festivalId: string }>();
      for (const row of insertedRows ?? []) {
        const source = batch.find((notification) => notification.notification_key === row.notification_key && notification.user_id === row.user_id);
        if (!source) continue;
        const key = `${source.title}::${source.body}::${source.festival_id}`;
        if (!pushBatches.has(key)) {
          pushBatches.set(key, {
            title: source.title,
            body: source.body,
            userIds: [],
            festivalId: source.festival_id,
          });
        }
        pushBatches.get(key)!.userIds.push(row.user_id);
      }

      for (const pushBatch of pushBatches.values()) {
        const pushResult = await sendOneSignalPush({
          userIds: pushBatch.userIds,
          title: pushBatch.title,
          body: pushBatch.body,
          url: actionUrl,
          data: {
            type: 'festival',
            festival_id: pushBatch.festivalId,
          },
        });
        totalPushTargets += pushResult.sent;
      }
    }

    return NextResponse.json({
      message: `Festival reminders sent`,
      festivals: festivals.map((f) => f.name),
      users:    users.length,
      inserted: totalInserted,
      push_targets: totalPushTargets,
    });
  } catch (error) {
    console.error('Festival cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Festival cron crashed' },
      { status: 500 }
    );
  }
}
