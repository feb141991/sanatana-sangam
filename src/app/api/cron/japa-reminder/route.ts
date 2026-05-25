import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

export async function GET(request: Request) {
  // Auth
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? '';
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? '';

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }
  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ error: 'Missing VAPID keys' }, { status: 500 });
  }

  webpush.setVapidDetails('mailto:support@sanatansangam.com', vapidPublicKey, vapidPrivateKey);

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const now = new Date();

  try {
    // Fetch users with japa reminders enabled
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, timezone, japa_reminder_time, japa_reminder_enabled')
      .eq('japa_reminder_enabled', true);

    if (usersError) throw usersError;

    const notified: string[] = [];

    for (const user of users || []) {
      const userTimezone = user.timezone || 'UTC';
      const [remHour] = (user.japa_reminder_time || '07:00').split(':').map(Number);

      // Get current hour in user's timezone
      let currentHour: number;
      try {
        const userTimeStr = now.toLocaleString('en-US', { timeZone: userTimezone });
        currentHour = new Date(userTimeStr).getHours();
      } catch {
        currentHour = now.getUTCHours();
      }

      if (currentHour !== remHour) continue;

      // Skip if japa already done today
      const { data: sadhana } = await supabase
        .from('daily_sadhana')
        .select('japa_done')
        .eq('user_id', user.id)
        .eq('date', todayDateStr)
        .maybeSingle();

      if (sadhana?.japa_done) continue;

      // Fetch push subscriptions
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', user.id);

      if (!subscriptions?.length) continue;

      const payload = JSON.stringify({
        title: '🔔 Time for Japa',
        body: "Your daily Japa practice awaits. Keep your streak alive 🙏",
        icon: '/icons/icon-192x192.png',
      });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          notified.push(user.id);
        } catch (err) {
          console.error(`Push failed for user ${user.id}:`, err);
          // Remove expired/invalid subscriptions (410 Gone)
          if ((err as any)?.statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('user_id', user.id)
              .eq('endpoint', sub.endpoint);
          }
        }
      }
    }

    return NextResponse.json({ success: true, notified_users: notified });
  } catch (err) {
    console.error('Japa reminder cron error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Cron crashed' },
      { status: 500 }
    );
  }
}
