import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { sendOneSignalPush } from '@/lib/onesignal-server';

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();
  // Filter by JSONB key for midday being true, mode IN ('full_day', 'advanced')
  // and having onesignal_player_id not null.
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, timezone, onesignal_player_id')
    .eq('nitya_sections_enabled->>midday', 'true')
    .in('nitya_rhythm_mode', ['full_day', 'advanced'])
    .not('onesignal_player_id', 'is', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  const targetUserIds: string[] = [];

  const rows = (profiles ?? []) as any[];

  for (const p of rows) {
    if (!p.timezone || !p.onesignal_player_id) continue;
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
        // We push the profile ID because OneSignal server code uses external_id
        targetUserIds.push(p.id);
      }
    } catch (err) {
      // Ignore invalid timezones
    }
  }

  if (targetUserIds.length > 0) {
    await sendOneSignalPush({
      userIds: targetUserIds,
      title: "Madhyahn Sandhya",
      body: "A two-minute pause at noon — light the inner lamp before the afternoon begins."
    });
  }

  return NextResponse.json({ success: true, notifiedCount: targetUserIds.length });
}
