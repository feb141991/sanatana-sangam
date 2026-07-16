import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { sendPushNotification } from '@/lib/push-server';

type ReminderProfile = {
  id: string;
  timezone: string | null;
};

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();
  // Filter by JSONB key for midday being true, mode IN ('full_day', 'advanced').
  // Do not gate on onesignal_player_id: native Expo recipients now live in
  // push_tokens, and sendPushNotification records no-token skips itself.
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, timezone')
    .eq('nitya_sections_enabled->>midday', 'true')
    .in('nitya_rhythm_mode', ['full_day', 'advanced']);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  const targetUserIds: string[] = [];

  const rows = (profiles ?? []) as ReminderProfile[];

  for (const p of rows) {
    if (!p.timezone) continue;
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: p.timezone,
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: 'h23'
      }).formatToParts(now);
      
      const hStr = parts.find(pt => pt.type === 'hour')?.value;
      const mStr = parts.find(pt => pt.type === 'minute')?.value;
      if (!hStr || !mStr) continue;
      
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      const mins = h * 60 + m;
      
      // 11:45 (705) to 12:15 (735)
      if (mins >= 705 && mins <= 735) {
        targetUserIds.push(p.id);
      }
    } catch (err) {
      // Ignore invalid timezones
    }
  }

  if (targetUserIds.length > 0) {
    await sendPushNotification({
      userIds: targetUserIds,
      title: "Madhyahn Sandhya",
      body: "A two-minute pause at noon — light the inner lamp before the afternoon begins."
    });
  }

  return NextResponse.json({ success: true, notifiedCount: targetUserIds.length });
}
