import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';

// ─── Festival Reminder Cron ───────────────────────────────────────────────────
// Schedule: 0 2 * * * (2 AM UTC daily = ~7:30 AM IST)
// Checks if any festival is exactly 7 days or 1 day away.
// If yes, inserts a notification row for EVERY user in the DB.
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const in1day  = new Date(today); in1day.setDate(in1day.getDate() + 1);
    const in7days = new Date(today); in7days.setDate(in7days.getDate() + 7);

    const fmt = (d: Date) => d.toISOString().split('T')[0];

    // Fetch festivals that are 1 or 7 days away
    const { data: festivals, error: festivalsError } = await supabase
      .from('festivals')
      .select('*')
      .in('date', [fmt(in1day), fmt(in7days)]);

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
      .select('id');

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

    let totalInserted = 0;
    let totalPushTargets = 0;

    for (const festival of festivals) {
      const daysAway = Math.round((new Date(festival.date).getTime() - today.getTime()) / 86400000);
      const title = daysAway === 1
        ? `${festival.emoji} ${festival.name} — Tomorrow!`
        : `${festival.emoji} ${festival.name} — In 7 days`;
      const body  = daysAway === 1
        ? `${festival.description}. Prepare your puja and celebrations.`
        : `${festival.name} is coming up on ${new Date(festival.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}. Plan ahead.`;

      const notifications = users.map((u) => ({
        user_id:    u.id,
        title,
        body,
        emoji:      festival.emoji,
        type:       'festival',
        action_url: actionPath,
      }));

      // Insert in batches of 100
      for (let i = 0; i < notifications.length; i += 100) {
        const batch = notifications.slice(i, i + 100);
        const { error: insertError } = await supabase
          .from('notifications')
          .insert(batch);

        if (insertError) {
          console.error('Festival cron notification insert failed:', insertError);
          return NextResponse.json(
            { error: `Notification insert failed: ${insertError.message}` },
            { status: 500 }
          );
        }

        totalInserted += batch.length;
      }

      const pushResult = await sendOneSignalPush({
        userIds: users.map((user) => user.id),
        title,
        body,
        url: actionUrl,
        data: {
          type: 'festival',
          festival_id: String(festival.id ?? ''),
        },
      });
      totalPushTargets += pushResult.sent;
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
