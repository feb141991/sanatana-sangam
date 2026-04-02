import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';

// ─── Shloka Streak Reminder Cron ─────────────────────────────────────────────
// Schedule: 0 13 * * * (1 PM UTC = ~6:30 PM IST — evening nudge)
// Finds users who have NOT read today's shloka (last_shloka_date !== today).
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
    const today = new Date().toISOString().split('T')[0];

    // Find users who haven't read today — last_shloka_date is null or not today
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, shloka_streak, full_name')
      .or(`last_shloka_date.is.null,last_shloka_date.neq.${today}`);

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

    const notifications = users.map((u) => {
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
      };
    });

    // Insert in batches of 100
    let totalInserted = 0;
    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      const { error: insertError } = await supabase.from('notifications').insert(batch);

      if (insertError) {
        console.error('Shloka cron notification insert failed:', insertError);
        return NextResponse.json(
          { error: `Notification insert failed: ${insertError.message}` },
          { status: 500 }
        );
      }

      totalInserted += batch.length;
    }

    const pushResult = await sendOneSignalPush({
      userIds: users.map((user) => user.id),
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
