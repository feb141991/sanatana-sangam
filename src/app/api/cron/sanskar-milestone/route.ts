import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOneSignalPush } from '@/lib/onesignal-server';

// ─── Sanskar Milestone Cron ───────────────────────────────────────────────────
// Schedule: 0 6 * * * (daily at 06:00 UTC — catches early-morning windows globally)
//
// Reads rows from notification_schedule where:
//   - status = 'pending'
//   - send_at <= NOW()
//
// For each due row, sends a OneSignal push to the user (via external_id),
// writes a bell notification, then marks the row 'sent' (or 'failed').
//
// notification_schedule uses service-role only for writes — this route
// always creates its own service-role client.

const BATCH_LIMIT = 200; // max rows to process per cron invocation

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    );
  }

  const supabase  = createClient(supabaseUrl, serviceRoleKey);
  const now       = new Date().toISOString();
  const actionUrl = new URL('/kul/sanskara', new URL(request.url).origin).toString();

  // ── 1. Fetch due notifications ─────────────────────────────────────────────
  const { data: dueRows, error: fetchError } = await supabase
    .from('notification_schedule')
    .select('id, user_id, title, body, metadata')
    .eq('status', 'pending')
    .lte('send_at', now)
    .order('send_at', { ascending: true })
    .limit(BATCH_LIMIT);

  if (fetchError) {
    console.error('[sanskar-milestone] Fetch error:', fetchError.message);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!dueRows || dueRows.length === 0) {
    return NextResponse.json({ message: 'No due milestone notifications', processed: 0 });
  }

  let sent    = 0;
  let failed  = 0;

  for (const row of dueRows) {
    try {
      // ── 2. Write to the in-app notifications bell ──────────────────────────
      const meta      = (row.metadata ?? {}) as Record<string, unknown>;
      const actionPath = '/kul/sanskara';

      await supabase.from('notifications').insert({
        user_id:    row.user_id,
        title:      row.title,
        body:       row.body,
        emoji:      '🕉️',
        type:       'sanskar_milestone',
        action_url: actionPath,
        notification_key: `sanskar_milestone:${row.id}`,
      });

      // ── 3. Send OneSignal push ─────────────────────────────────────────────
      await sendOneSignalPush({
        userIds: [row.user_id],
        title:   row.title,
        body:    row.body,
        url:     actionUrl,
        data: {
          type:          'sanskar_milestone',
          sanskara_id:   String(meta.sanskara_id  ?? ''),
          kul_member_id: String(meta.kul_member_id ?? ''),
        },
      });

      // ── 4. Mark sent ───────────────────────────────────────────────────────
      await supabase
        .from('notification_schedule')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', row.id);

      sent++;
    } catch (err) {
      console.error('[sanskar-milestone] Row error:', row.id, err);

      await supabase
        .from('notification_schedule')
        .update({ status: 'failed', error: String(err) })
        .eq('id', row.id);

      failed++;
    }
  }

  return NextResponse.json({
    message:   'Sanskar milestone cron complete',
    processed: dueRows.length,
    sent,
    failed,
  });
}
