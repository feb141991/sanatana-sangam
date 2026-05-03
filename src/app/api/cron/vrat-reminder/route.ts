import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';
import { canSendInLocalWindow, getLocalDateIso, isoDateDiff, resolveTimeZone } from '@/lib/sacred-time';

// ─── Gender-Specific Vrat Reminder Cron ──────────────────────────────────────
// Schedule: 0 7 * * * (same morning window as festival-reminder)
//
// Sends personalized reminders to female Hindu users for vrats that are
// traditionally observed by women. Uses warmer, more intimate copy than the
// generic festival cron.
//
// Targeted vrats (2026):
//   - Hartalika Teej  — 2026-09-02
//   - Karva Chauth    — 2026-10-15
//   - Vat Savitri     — 2026-05-22
//
// Targeting criteria:
//   tradition = 'hindu' (or null)
//   gender_context = 'female' (or null — we include null to avoid missing users
//                                who haven't filled their profile yet)
//
// The notification_key "vrat-female:<festival_name>:<days>:<date>" keeps these
// distinct from the generic festival-reminder messages on the same day.
// ─────────────────────────────────────────────────────────────────────────────

const FEMALE_VRATS: Array<{
  name: string;
  date: string; // YYYY-MM-DD
  emoji: string;
  copy7: string;  // 7 days away copy
  copy1: string;  // 1 day away copy
}> = [
  {
    name:  'Vat Savitri Vrat',
    date:  '2026-05-22',
    emoji: '🌳',
    copy7: 'Vat Savitri is one week away 🌳 Begin soaking the threads, arrange your puja items, and plan the sunrise fast with your family.',
    copy1: 'Vat Savitri is tomorrow 🌳 Prepare your sacred thread, fruits, and water. Rise before sunrise and observe your vrat for the long life of your family.',
  },
  {
    name:  'Hartalika Teej',
    date:  '2026-09-02',
    emoji: '🌿',
    copy7: 'Hartalika Teej is one week away 🌿 The festival of Parvati\'s devotion — prepare your green bangles, mehndi, and saatvik food for the fast.',
    copy1: 'Hartalika Teej is tomorrow 🌿 Fast from sunrise, keep the night vigil, and worship Shiva-Parvati together. Your devotion is your strength.',
  },
  {
    name:  'Karva Chauth',
    date:  '2026-10-15',
    emoji: '🌙',
    copy7: 'Karva Chauth is one week away 🌙 The most beloved vrat for married women — plan your sargi, mehndi, and the moonrise puja in advance.',
    copy1: 'Karva Chauth is tomorrow 🌙 Tomorrow you fast from sunrise to moonrise. May the moonlight bless you and your family with love and long life. 🙏',
  },
];

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
    const targetLocalHour = 9;
    const actionPath      = '/home?focus=festivals';
    const baseUrl         = new URL(request.url).origin;
    const actionUrl       = new URL(actionPath, baseUrl).toString();

    // Target Hindu female users (or those with unset gender)
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, tradition, gender_context, timezone, notification_quiet_hours_start, notification_quiet_hours_end')
      .or('tradition.eq.hindu,tradition.is.null')
      .or('gender_context.eq.female,gender_context.is.null');

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }
    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No target users found', sent: 0 });
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
      _push_title: string;
      _push_body: string;
    }> = [];

    for (const user of users) {
      const tz        = resolveTimeZone((user as any).timezone);
      const localDate = getLocalDateIso(now, tz);

      if (!canSendInLocalWindow(
        now,
        tz,
        targetLocalHour,
        (user as any).notification_quiet_hours_start ?? null,
        (user as any).notification_quiet_hours_end ?? null
      )) continue;

      for (const vrat of FEMALE_VRATS) {
        const daysAway = isoDateDiff(vrat.date, localDate);
        if (daysAway !== 1 && daysAway !== 7) continue;

        const title = daysAway === 1
          ? `${vrat.emoji} ${vrat.name} — Tomorrow!`
          : `${vrat.emoji} ${vrat.name} — In 7 days`;
        const body  = daysAway === 1 ? vrat.copy1 : vrat.copy7;

        notifications.push({
          user_id:          user.id,
          title,
          body,
          emoji:            vrat.emoji,
          type:             'festival',
          action_url:       actionPath,
          notification_key: `vrat-female:${vrat.name}:${daysAway}:${localDate}`,
          local_date:       localDate,
          sent_timezone:    tz,
          _push_title:      title,
          _push_body:       body,
        });
      }
    }

    if (notifications.length === 0) {
      return NextResponse.json({ message: 'No vrat reminders due today', sent: 0 });
    }

    let totalInserted  = 0;
    const insertedIds: string[] = [];

    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      const dbBatch = batch.map(({ _push_title: _, _push_body: __, ...rest }) => rest);
      const { data: rows, error: insertErr } = await supabase
        .from('notifications')
        .upsert(dbBatch, { onConflict: 'user_id,notification_key', ignoreDuplicates: true })
        .select('user_id, notification_key');
      if (insertErr) {
        console.error('[vrat-reminder] insert error:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      totalInserted += rows?.length ?? 0;
      insertedIds.push(...((rows ?? []).map((r: { user_id: string }) => r.user_id)));
    }

    // Group pushes by unique title+body combination
    const pushGroups = new Map<string, { title: string; body: string; userIds: string[] }>();
    for (const n of notifications) {
      const key = `${n._push_title}::${n._push_body}`;
      if (!pushGroups.has(key)) {
        pushGroups.set(key, { title: n._push_title, body: n._push_body, userIds: [] });
      }
      // Only push to users who actually got an insert (insertedIds)
      if (insertedIds.includes(n.user_id)) {
        pushGroups.get(key)!.userIds.push(n.user_id);
      }
    }

    let totalPushSent = 0;
    for (const group of pushGroups.values()) {
      if (group.userIds.length === 0) continue;
      const result = await sendOneSignalPush({
        userIds: group.userIds,
        title:   group.title,
        body:    group.body,
        url:     actionUrl,
        data:    { type: 'festival' },
      });
      totalPushSent += result.sent;
    }

    return NextResponse.json({
      message:      'Vrat reminders sent',
      reminded:     totalInserted,
      push_targets: totalPushSent,
    });
  } catch (error) {
    console.error('[vrat-reminder] cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron crashed' },
      { status: 500 }
    );
  }
}
