import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';

// ─── POST /api/kul/invite ─────────────────────────────────────────────────────
// Sends a Kul invite notification to another user.
//
// The notifications table has no INSERT policy for authenticated users — users can
// only SELECT/UPDATE their OWN rows. Inserting on behalf of another user (toUserId)
// requires the service role key. This route handles that server-side.
//
// Body: { toUserId: string; kulId: string; kulName: string; inviteCode: string }

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { toUserId: string; kulId: string; kulName: string; inviteCode: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { toUserId, kulId, kulName, inviteCode } = body;
  if (!toUserId || !kulId || !kulName || !inviteCode) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify the sender is actually a member of this Kul
  const { data: membership } = await supabase
    .from('kul_members')
    .select('id, role')
    .eq('kul_id', kulId)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'You are not a member of this Kul' }, { status: 403 });
  }

  // Don't let someone invite themselves
  if (toUserId === user.id) {
    return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });
  }

  // Use service role to insert notification for the target user
  const serviceSupabase = createServiceRoleSupabaseClient();

  const { error } = await serviceSupabase.from('notifications').insert({
    user_id:          toUserId,
    title:            `You&apos;ve been invited to join ${kulName}`,
    body:             `Use code ${inviteCode} to join ${kulName} on Shoonaya.`,
    emoji:            '🏡',
    action_url:       '/kul',
    type:             'kul_invite',
    notification_key: `kul_invite:${kulId}:${toUserId}:${user.id}`,
  });

  if (error) {
    // Duplicate key = already invited, treat as success
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, alreadyInvited: true });
    }
    console.error('[kul/invite] Insert error:', error.message);
    return NextResponse.json({ error: 'Could not send invite' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
