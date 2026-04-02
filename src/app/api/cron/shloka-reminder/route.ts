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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date().toISOString().split('T')[0];

  // Find users who haven't read today — last_shloka_date is null or not today
  const { data: users } = await supabase
    .from('profiles')
    .select('id, shloka_streak, full_name')
    .or(`last_shloka_date.is.null,last_shloka_date.neq.${today}`);

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
      action_url: '/home',
    };
  });

  // Insert in batches of 100
  let totalInserted = 0;
  for (let i = 0; i < notifications.length; i += 100) {
    const batch = notifications.slice(i, i + 100);
    await supabase.from('notifications').insert(batch);
    totalInserted += batch.length;
  }

  const pushResult = await sendOneSignalPush({
    userIds: users.map((user) => user.id),
    title: 'Aaj Ka Shloka awaits',
    body: 'Take a quiet moment for today\'s sacred text and keep your practice flowing.',
    url: '/home',
    data: {
      type: 'streak',
    },
  });

  return NextResponse.json({
    message:  'Shloka reminders sent',
    reminded: totalInserted,
    push_targets: pushResult.sent,
  });
}
