import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const in1day  = new Date(today); in1day.setDate(in1day.getDate() + 1);
  const in7days = new Date(today); in7days.setDate(in7days.getDate() + 7);

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  // Fetch festivals that are 1 or 7 days away
  const { data: festivals } = await supabase
    .from('festivals')
    .select('*')
    .in('date', [fmt(in1day), fmt(in7days)]);

  if (!festivals || festivals.length === 0) {
    return NextResponse.json({ message: 'No festivals due for reminder', sent: 0 });
  }

  // Fetch all user IDs
  const { data: users } = await supabase
    .from('profiles')
    .select('id');

  if (!users || users.length === 0) {
    return NextResponse.json({ message: 'No users', sent: 0 });
  }

  let totalInserted = 0;

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
      action_url: '/home',
    }));

    // Insert in batches of 100
    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      const { count } = await supabase
        .from('notifications')
        .insert(batch);
      totalInserted += batch.length;
    }
  }

  return NextResponse.json({
    message: `Festival reminders sent`,
    festivals: festivals.map((f) => f.name),
    users:    users.length,
    inserted: totalInserted,
  });
}
