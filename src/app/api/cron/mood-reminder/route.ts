import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';
import { canSendInLocalWindow, getLocalDateIso, resolveTimeZone } from '@/lib/sacred-time';

// ─── Mood Check-In Reminder Cron ─────────────────────────────────────────────
// Schedule: 30 6 * * * (6:30 AM UTC = ~noon IST, midday UK time)
//
// Sends a gentle midday nudge to users who have NOT set a mood today.
// Mood state is stored in localStorage (home_mood_date / home_mood_key) on the
// client, so we can't query it server-side. Instead we send a universal noon
// notification to all users who have push enabled — it acts as a friendly
// "how are you feeling?" check-in that deep-links to /discover.
//
// Idempotency: uses notification_key "mood-checkin:<date>" so the row is
// inserted only once per local date even if the cron fires twice.

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

  try {
    const baseUrl   = new URL(request.url).origin;
    const actionPath = '/discover';
    const actionUrl  = new URL(actionPath, baseUrl).toString();
    const now        = new Date();
    const targetLocalHour = 12; // noon local time

    // Fetch all users with notifications enabled
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, tradition, timezone, notification_quiet_hours_start, notification_quiet_hours_end');

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }
    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users found', sent: 0 });
    }

    const MOOD_PROMPTS_BY_TRADITION: Record<string, string[]> = {
      hindu:    ['How is your inner space today?', 'How does your heart feel in this moment?', 'Take a breath — what is your mood right now?'],
      sikh:     ['Waheguru\'s grace is with you — how do you feel?', 'Pause for a moment. What does your heart say?'],
      buddhist: ['Notice this moment — what feelings are present?', 'Be present — how is your mind right now?'],
      jain:     ['In this moment of awareness — how are you?', 'Pause and observe — what is your inner state?'],
      other:    ['How are you feeling right now?', 'Take a quiet breath — what is your mood?'],
    };

    const eligibleUsers = users.filter((user) => {
      const tz = resolveTimeZone((user as any).timezone);
      return canSendInLocalWindow(
        now,
        tz,
        targetLocalHour,
        (user as any).notification_quiet_hours_start ?? null,
        (user as any).notification_quiet_hours_end ?? null
      );
    });

    if (eligibleUsers.length === 0) {
      return NextResponse.json({ message: 'No users in noon window', sent: 0 });
    }

    const notifications = eligibleUsers.map((u) => {
      const tz        = resolveTimeZone((u as any).timezone);
      const localDate = getLocalDateIso(now, tz);
      const tradition = ((u as any).tradition ?? 'hindu') as string;
      const prompts   = MOOD_PROMPTS_BY_TRADITION[tradition] ?? MOOD_PROMPTS_BY_TRADITION.other;
      const prompt    = prompts[Math.floor(Math.random() * prompts.length)];

      return {
        user_id:          u.id,
        title:            '🌿 Midday check-in',
        body:             `${prompt} Let scripture meet your mood.`,
        emoji:            '🌿',
        type:             'general' as const,
        action_url:       actionPath,
        notification_key: `mood-checkin:${localDate}`,
        local_date:       localDate,
        sent_timezone:    tz,
      };
    });

    let totalInserted  = 0;
    const insertedIds: string[] = [];
    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      const { data: rows, error: insertErr } = await supabase
        .from('notifications')
        .upsert(batch, { onConflict: 'user_id,notification_key', ignoreDuplicates: true })
        .select('user_id');
      if (insertErr) {
        console.error('mood-reminder insert error:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      totalInserted += rows?.length ?? 0;
      insertedIds.push(...((rows ?? []).map((r: { user_id: string }) => r.user_id)));
    }

    const pushResult = await sendOneSignalPush({
      userIds: insertedIds,
      title:   'Midday check-in 🌿',
      body:    'How are you feeling? Let scripture meet your mood.',
      url:     actionUrl,
      data:    { type: 'general' },
    });

    return NextResponse.json({
      message:      'Mood reminders sent',
      reminded:     totalInserted,
      push_targets: pushResult.sent,
    });
  } catch (error) {
    console.error('mood-reminder cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron crashed' },
      { status: 500 }
    );
  }
}
