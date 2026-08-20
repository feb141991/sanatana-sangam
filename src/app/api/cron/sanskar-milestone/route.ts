import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushNotification } from '@/lib/push-server';

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
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  const succeededRows: Array<{
    id: string;
    notification: {
      user_id: string;
      title: string;
      body: string;
      emoji: string;
      type: string;
      action_url: string;
      notification_key: string;
    };
  }> = [];

  const failedRows: Array<{ id: string; error: string }> = [];

  for (const row of dueRows) {
    try {
      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      const actionPath = '/kul/sanskara';

      // ── 2. Send OneSignal push (per-recipient personalized content) ─────────
      await sendPushNotification({
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

      succeededRows.push({
        id: row.id,
        notification: {
          user_id:    row.user_id,
          title:      row.title,
          body:       row.body,
          emoji:      '🕉️',
          type:       'sanskar_milestone',
          action_url: actionPath,
          notification_key: `sanskar_milestone:${row.id}`,
        },
      });
    } catch (err) {
      console.error('[sanskar-milestone] Row error:', row.id, err);
      failedRows.push({ id: row.id, error: String(err) });
    }
  }

  // ── 3. Bulk insert succeeded in-app notifications ─────────────────────────
  if (succeededRows.length > 0) {
    const { error: insertError } = await supabase
      .from('notifications')
      .insert(succeededRows.map((r) => r.notification));

    if (insertError) {
      console.error('[sanskar-milestone] Bulk notifications insert error:', insertError.message);
    }

    // ── 4. Bulk mark schedule rows as sent ─────────────────────────────────
    const sentAt = new Date().toISOString();
    const succeededIds = succeededRows.map((r) => r.id);
    const { error: updateError } = await supabase
      .from('notification_schedule')
      .update({ status: 'sent', sent_at: sentAt })
      .in('id', succeededIds);

    if (updateError) {
      console.error('[sanskar-milestone] Bulk notification_schedule update error:', updateError.message);
    }
  }

  // ── 5. Bulk mark failed schedule rows ────────────────────────────────────
  if (failedRows.length > 0) {
    const failedIds = failedRows.map((r) => r.id);
    const { error: failedUpdateError } = await supabase
      .from('notification_schedule')
      .update({ status: 'failed', error: 'Push delivery failed' })
      .in('id', failedIds);

    if (failedUpdateError) {
      console.error('[sanskar-milestone] Bulk failed schedule update error:', failedUpdateError.message);
    }
  }

  const sent = succeededRows.length;
  const failed = failedRows.length;

  return NextResponse.json({
    message:   'Sanskar milestone cron complete',
    processed: dueRows.length,
    sent,
    failed,
  });
}
