import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';
import { canSendInLocalWindow, getLocalDateIso, resolveTimeZone } from '@/lib/sacred-time';

// ─── Nitya Karma Morning Reminder Cron ───────────────────────────────────────
// Schedule: runs twice daily to reach IST (10:30 PM UTC = 4 AM IST)
//           and UK/EU (6 AM UTC = 6 AM UTC).
// Finds users who have NOT started their morning sequence today (zero steps done).
// Sends a gentle nudge to begin their Nitya Karma practice.

const TARGET_LOCAL_HOUR = 5; // Target ~5 AM in the user's local timezone

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
    const baseUrl   = new URL(request.url).origin;
    const actionPath = '/nitya-karma';
    const actionUrl  = new URL(actionPath, baseUrl).toString();
    const now        = new Date();

    // Fetch all users who have notifications enabled
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, tradition, timezone, notification_quiet_hours_start, notification_quiet_hours_end');

    if (usersError) {
      console.error('Nitya cron users query failed:', usersError);
      return NextResponse.json({ error: `Profiles query failed: ${usersError.message}` }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users', sent: 0 });
    }

    // Filter to users in their early morning window
    const eligibleUsers = users.filter((user) => {
      const timeZone = resolveTimeZone((user as any).timezone);
      return canSendInLocalWindow(
        now,
        timeZone,
        TARGET_LOCAL_HOUR,
        (user as any).notification_quiet_hours_start ?? null,
        (user as any).notification_quiet_hours_end   ?? null,
        2  // ±2 hours tolerance → fires between 3–7 AM local
      );
    });

    if (eligibleUsers.length === 0) {
      return NextResponse.json({ message: 'No users in morning window', sent: 0 });
    }

    // Find which of those users have NOT done ANY steps today
    const eligibleIds = eligibleUsers.map(u => u.id);

    // Fetch today's log for eligible users
    const localDates = new Map<string, string>();
    for (const user of eligibleUsers) {
      const tz = resolveTimeZone((user as any).timezone);
      localDates.set(user.id, getLocalDateIso(now, tz));
    }

    // We query all of today's nitya_karma_log rows for eligible users
    // using the earliest local date (some users may be slightly different dates)
    const uniqueDates = [...new Set(localDates.values())];

    const { data: logRows } = await supabase
      .from('nitya_karma_log')
      .select('user_id, log_date')
      .in('user_id', eligibleIds)
      .in('log_date', uniqueDates);

    const startedUserIds = new Set(
      (logRows ?? []).map((r: { user_id: string; log_date: string }) => {
        // Only count as started if row matches user's local date
        return r.log_date === localDates.get(r.user_id) ? r.user_id : null;
      }).filter(Boolean)
    );

    const unstartedUsers = eligibleUsers.filter(u => !startedUserIds.has(u.id));

    if (unstartedUsers.length === 0) {
      return NextResponse.json({ message: 'All morning-window users have already started', sent: 0 });
    }

    // Build tradition-aware notification messages
    const TRADITION_NUDGE: Record<string, { title: string; body: string }> = {
      hindu:    { title: '🌅 Brahma Muhurta — Begin Your Sadhana', body: 'Suprabhat! Your morning sequence awaits. Start with snana and let the day begin in dharma.' },
      sikh:     { title: '☬ Amrit Vela — Begin Your Nitnem',      body: 'Sat Sri Akal! This is the ambrosial hour. Your morning nitnem brings Waheguru\'s grace.' },
      buddhist: { title: '☸️ Morning Practice Awaits',              body: 'May this morning bring clarity. Begin your sitting practice before the day takes hold.' },
      jain:     { title: '🤲 Begin Your Morning Pratikraman',      body: 'Jai Jinendra! The dawn hour is auspicious. Begin your samayika and navkar mantra.' },
    };

    const notifications = unstartedUsers.map((u) => {
      const timeZone = resolveTimeZone((u as any).timezone);
      const localDate = getLocalDateIso(now, timeZone);
      const tradition = (u as any).tradition ?? 'hindu';
      const nudge = TRADITION_NUDGE[tradition] ?? TRADITION_NUDGE.hindu;
      return {
        user_id:          u.id,
        title:            nudge.title,
        body:             nudge.body,
        emoji:            '🌅',
        type:             'seva' as const,   // 'nitya' is not in the DB enum yet — using 'seva' until migration
        action_url:       actionPath,
        notification_key: `nitya:morning:${localDate}`,
        local_date:       localDate,
        sent_timezone:    timeZone,
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
        console.error('Nitya cron insert failed:', insertError);
        return NextResponse.json({ error: `Notification insert failed: ${insertError.message}` }, { status: 500 });
      }

      totalInserted += insertedRows?.length ?? 0;
      insertedUserIds.push(...((insertedRows ?? []).map((r: { user_id: string }) => r.user_id)));
    }

    // Send push notifications grouped by tradition for personalised copy
    const byTradition = new Map<string, string[]>();
    for (const u of unstartedUsers) {
      if (!insertedUserIds.includes(u.id)) continue;
      const t = (u as any).tradition ?? 'hindu';
      if (!byTradition.has(t)) byTradition.set(t, []);
      byTradition.get(t)!.push(u.id);
    }

    let totalPushTargets = 0;
    const TRADITION_NUDGE_FULL = TRADITION_NUDGE;

    for (const [trad, userIds] of byTradition.entries()) {
      const nudge = TRADITION_NUDGE_FULL[trad] ?? TRADITION_NUDGE_FULL.hindu;
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
      message:     'Nitya karma reminders sent',
      eligible:    eligibleUsers.length,
      unstarted:   unstartedUsers.length,
      inserted:    totalInserted,
      push_targets: totalPushTargets,
    });
  } catch (error) {
    console.error('Nitya cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nitya cron crashed' },
      { status: 500 }
    );
  }
}
