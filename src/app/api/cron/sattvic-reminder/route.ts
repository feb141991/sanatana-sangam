import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';
import { canSendInLocalWindow, getLocalDateIso, resolveTimeZone } from '@/lib/sacred-time';
import { isInWindow, getPanchangTimes } from '@/lib/panchang';

// ─── Sattvic Mode Evening Reminder Cron ──────────────────────────────────────
// Schedule: runs at 11 AM UTC (≈ 4:30 PM IST — evening sandhyā window).
// Sends a reminder to open Sattvic Mode for evening prānāyāma or kīrtana.
// Skips users who have already received this notification today.
// Respects Rahu Kalam (no nudge during inauspicious window).

const TARGET_LOCAL_HOUR   = 17; // ~5 PM in user's local timezone
const RAHU_TOLERANCE_MS   = 5 * 60_000;

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
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const now      = new Date();
  const actionUrl = new URL('/bhakti/zen', new URL(request.url).origin).toString();

  try {
    // Fetch users who have wantsSattvicReminder enabled (fallback: wants_shloka_reminders)
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, tradition, timezone, latitude, longitude, wants_shloka_reminders, notification_quiet_hours_start, notification_quiet_hours_end')
      .eq('wants_shloka_reminders', true); // reuse shloka pref as "evening practice" opt-in

    if (usersError || !users?.length) {
      return NextResponse.json({ message: 'No users or query failed', sent: 0 });
    }

    // Filter: evening window
    const windowUsers = users.filter((user: any) => {
      const tz = resolveTimeZone(user.timezone);
      return canSendInLocalWindow(
        now, tz, TARGET_LOCAL_HOUR,
        user.notification_quiet_hours_start ?? null,
        user.notification_quiet_hours_end ?? null,
        2,
      );
    });

    // Filter: skip Rahu Kalam
    const eligibleUsers = windowUsers.filter((user: any) => {
      try {
        const times = getPanchangTimes(now, user.latitude ?? null, user.longitude ?? null);
        if (isInWindow(now, times.rahuKaalStart, times.rahuKaalEnd, RAHU_TOLERANCE_MS)) return false;
        return true;
      } catch { return true; }
    });

    if (!eligibleUsers.length) {
      return NextResponse.json({ message: 'No eligible users', sent: 0 });
    }

    const SANDHYA_NUDGE: Record<string, { title: string; body: string }> = {
      hindu:    { title: '🌅 Evening Sandhyā — Sattvic Mode Awaits', body: 'The day softens. Step into Sattvic Mode for prānāyāma, kīrtana, or silent svādhyāya before the evening meal.' },
      sikh:     { title: '☬ Evening Rehras Sahib Time',              body: 'The ambrosial hour of dusk approaches. Open Sattvic Mode for Rehras Sahib or naam simran.' },
      buddhist: { title: '☸️ Evening Sitting Practice',               body: 'As the day quietens, your sitting practice awaits. Five minutes of Sattvic presence before the evening.' },
      jain:     { title: '🤲 Evening Pratikraman Reminder',          body: 'The evening hour calls for pratikraman. Open Sattvic Mode to sit, breathe, and reflect on today\'s actions.' },
    };

    const notifications = eligibleUsers.map((user: any) => {
      const tz        = resolveTimeZone(user.timezone);
      const localDate = getLocalDateIso(now, tz);
      const tradition = user.tradition ?? 'hindu';
      const nudge     = SANDHYA_NUDGE[tradition] ?? SANDHYA_NUDGE.hindu;

      return {
        user_id:          user.id,
        title:            nudge.title,
        body:             nudge.body,
        emoji:            '🕉️',
        type:             'sattvic-evening',
        action_url:       '/bhakti/zen',
        notification_key: `sattvic:evening:${localDate}`,
        local_date:       localDate,
        sent_timezone:    tz,
      };
    });

    // Insert with deduplication
    let totalInserted    = 0;
    const insertedUserIds: string[] = [];

    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      const { data: insertedRows, error: insertError } = await supabase
        .from('notifications')
        .upsert(batch, { onConflict: 'user_id,notification_key', ignoreDuplicates: true })
        .select('user_id');

      if (insertError) { console.error('Sattvic cron insert failed:', insertError); continue; }
      totalInserted += insertedRows?.length ?? 0;
      insertedUserIds.push(...(insertedRows ?? []).map((r: { user_id: string }) => r.user_id));
    }

    // OneSignal push
    const toSend = eligibleUsers.filter((u: any) => insertedUserIds.includes(u.id));
    const byTradition = new Map<string, string[]>();
    for (const u of toSend as any[]) {
      const t = u.tradition ?? 'hindu';
      if (!byTradition.has(t)) byTradition.set(t, []);
      byTradition.get(t)!.push(u.id);
    }

    let totalPushTargets = 0;
    for (const [tradition, userIds] of byTradition.entries()) {
      const nudge = SANDHYA_NUDGE[tradition] ?? SANDHYA_NUDGE.hindu;
      const result = await sendOneSignalPush({ userIds, title: nudge.title, body: nudge.body, url: actionUrl, data: { type: 'sattvic-evening' } });
      totalPushTargets += result.sent;
    }

    return NextResponse.json({
      message:      'Sattvic evening reminders sent',
      eligible:     eligibleUsers.length,
      inserted:     totalInserted,
      push_targets: totalPushTargets,
    });
  } catch (error) {
    console.error('Sattvic cron crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sattvic cron crashed' },
      { status: 500 }
    );
  }
}
