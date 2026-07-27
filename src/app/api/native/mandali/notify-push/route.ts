import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { sendPushNotification } from '@/lib/push-server';

// Bridges the Postgres-trigger-driven in-app notifications (public.notifications,
// written by handle_mandali_connection_change / handle_user_block_cascade /
// log_content_report / log_post_reaction -- see supabase/migrations/
// 20260727165847_mandali_connections_reactions_activity_log.sql and
// 20260727225429_wire_silent_mandali_notifications.sql) to actual OS push
// on the native app, via the same sendPushNotification() reader every cron
// in this repo already uses (src/lib/push-server.ts).
//
// The trigger already decided *whether* to notify (respecting
// wants_community_notifications and block state) and wrote exactly one row
// keyed by notificationKey -- this route doesn't re-derive any of that
// gating. It just atomically claims that row (UPDATE ... SET pushed_at =
// now() WHERE pushed_at IS NULL) and, if the claim succeeded, pushes the
// row's own title/body/url. If no row exists (trigger skipped it) or it
// was already claimed by an earlier call, this is a no-op -- single source
// of truth, no duplicated gating logic between SQL and TypeScript, and no
// way to spam-resend the same push by calling this repeatedly with the
// same key (notification_key values are deterministic over ids the caller
// already knows, e.g. post_reaction:<post_id>:<their_own_user_id>, so
// without the claim this endpoint would otherwise let any authenticated
// user repeatedly push another user's device).
export async function POST(request: NextRequest) {
  const { user, error } = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: error?.message ?? 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const notificationKey = typeof body?.notificationKey === 'string' ? body.notificationKey.trim() : '';
  if (!notificationKey) {
    return NextResponse.json({ error: 'notificationKey is required' }, { status: 400 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: claimed, error: claimError } = await supabase
    .from('notifications')
    .update({ pushed_at: new Date().toISOString() })
    .eq('notification_key', notificationKey)
    .is('pushed_at', null)
    .select('id, user_id, title, body, action_url, type')
    .maybeSingle();

  if (claimError) {
    return NextResponse.json({ error: claimError.message }, { status: 500 });
  }
  if (!claimed) {
    // Either the trigger decided not to notify, or this key was already pushed.
    return NextResponse.json({ pushed: false });
  }

  const result = await sendPushNotification(
    {
      userIds: [claimed.user_id],
      title: claimed.title,
      body: claimed.body,
      url: claimed.action_url,
      data: { type: claimed.type },
    },
    {
      type: claimed.type,
      notificationKey,
      notificationIdsByUserId: { [claimed.user_id]: claimed.id },
    }
  );

  return NextResponse.json({ pushed: result.sent > 0 });
}
