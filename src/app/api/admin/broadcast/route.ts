import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { sendOneSignalPush } from '@/lib/onesignal-server';

// ─── POST /api/admin/broadcast ────────────────────────────────────────────────
// Sends a broadcast notification to all users — inserts into the notifications
// table and fires a OneSignal push. Admin-only.

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminSupabase = createServiceRoleSupabaseClient();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const title: string = (body.title ?? '').trim();
  const msg:   string = (body.body  ?? '').trim();

  if (!title || !msg) {
    return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
  }

  // Fetch all user IDs
  const { data: users, error: usersError } = await adminSupabase
    .from('profiles')
    .select('id');

  if (usersError) {
    return NextResponse.json({ error: `Could not fetch users: ${usersError.message}` }, { status: 500 });
  }

  const userIds = (users ?? []).map((u: { id: string }) => u.id);

  // Insert in-app notifications
  const notifications = userIds.map((uid) => ({
    user_id:    uid,
    title,
    body:       msg,
    emoji:      '📢',
    type:       'general' as const,
    action_url: '/home',
  }));

  let inserted = 0;
  for (let i = 0; i < notifications.length; i += 200) {
    const { data: rows, error } = await adminSupabase
      .from('notifications')
      .insert(notifications.slice(i, i + 200))
      .select('id');
    if (!error) inserted += rows?.length ?? 0;
  }

  // OneSignal push
  const pushResult = await sendOneSignalPush({
    userIds,
    title,
    body:  msg,
    url:   `${new URL(request.url).origin}/home`,
    data:  { type: 'broadcast' },
  });

  return NextResponse.json({
    inserted,
    sent:  pushResult.sent,
    total: userIds.length,
  });
}
