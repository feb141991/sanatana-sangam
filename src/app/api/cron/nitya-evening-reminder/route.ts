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
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, timezone')
    .eq('nitya_sections_enabled->>evening', 'true');

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
      
      // 18:15 (1095) to 18:45 (1125)
      if (mins >= 1095 && mins <= 1125) {
        targetUserIds.push(p.id);
      }
    } catch (err) {
      // Ignore invalid timezones
    }
  }

  if (targetUserIds.length > 0) {
    await sendPushNotification({
      userIds: targetUserIds,
      title: "Sandhya Diya",
      body: "The sun is setting. Light the diya and close the day with intention."
    });
  }

  return NextResponse.json({ success: true, notifiedCount: targetUserIds.length });
}
