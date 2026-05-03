import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';
import { canSendInLocalWindow, getLocalDateIso, resolveTimeZone } from '@/lib/sacred-time';

// ─── Evening Mood Check-In Reminder ──────────────────────────────────────────
// Schedule: 30 12 * * * (12:30 PM UTC = ~6 PM IST, early evening UK time)
//
// Second daily nudge for users who haven't set their mood today. Since mood
// is stored in localStorage we cannot query it server-side, so this fires
// universally to all push-enabled users. The notification body is distinctly
// "end of day" in tone so it doesn't feel repetitive.
//
// notification_key "mood-evening:<date>" ensures no duplicates per local date.
// ─────────────────────────────────────────────────────────────────────────────

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
    const now             = new Date();
    const targetLocalHour = 18; // 6 PM local

    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, tradition, timezone, notification_quiet_hours_start, notification_quiet_hours_end');

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }
    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users found', sent: 0 });
    }

    const EVENING_PROMPTS_BY_TRADITION: Record<string, string[]> = {
      hindu:    [
        'As the day winds down, how has your inner journey been?',
        'Before evening puja, take a moment — how do you feel?',
        'The setting sun invites reflection. What is your mood?',
      ],
      sikh:     [
        'As Rehras Sahib time approaches, how does your heart feel?',
        'The evening Gurbani calls — how are you in this moment?',
      ],
      buddhist: [
        'Evening meditation begins with awareness. How are you?',
        'As the day closes, what feelings are present for you?',
      ],
      jain:     [
        'Evening pratikraman time — how has your inner space been?',
        'Before your evening samayik, check in: how do you feel?',
      ],
      other:    [
        'As the day winds down, how are you feeling?',
        'Take a quiet moment — what is your mood this evening?',
      ],
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
      return NextResponse.json({ message: 'No users in evening window', sent: 0 });
    }

    const notifications = eligibleUsers.map((u) => {
      const tz        = resolveTimeZone((u as any).timezone);
      const localDate = getLocalDateIso(now, tz);
      const tradition = ((u as any).tradition ?? 'hindu') as string;
      const prompts   = EVENING_PROMPTS_BY_TRADITION[tradition] ?? EVENING_PROMPTS_BY_TRADITION.other;
      const prompt    = prompts[Math.floor(Math.random() * prompts.length)];

      return {
        user_id:          u.id,
        title:            '🌙 Evening check-in',
        body:             `${prompt} Let scripture meet your mood.`,
        emoji:            '🌙',
        type:             'general' as const,
        action_url:       '/discover',
        notification_key: `mood-evening:${localDate}`,
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
        console.error('mood-reminder-evening insert error:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      totalInserted += rows?.length ?? 0;
      insertedIds.push(...((rows ?? []).map((r: { user_id: string }) => r.user_id)));
    }

    const baseUrl    = new URL(request.url).origin;
    const actionUrl  = new URL('/discover', baseUrl).toString();
    const pushResult = await sendOneSignalPush({
      userIds: insertedIds,
      title:   'Evening check-in 🌙',
      body:    'How has your inner journey been today? Let scripture meet your mood.',
      url:     actionUrl,
      data:    { type: 'general' },
    });

    return NextResponse.json({
      message:      'Evening mood reminders sent',
      reminded:     totalInserted,
      push_targets: pushResult.sent,
    });
  } catch (error) {
    console.error('mood-reminder-evening cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron crashed' },
      { status: 500 }
    );
  }
}
