import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;
  const { userId } = await params;

  // userId flows into a raw .or() filter string below (PostgREST's JS
  // client has no parameterized form for .or()), so it must be validated
  // as a UUID first -- otherwise a crafted path segment could inject
  // extra filter clauses.
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  const { data, error } = await admin.supabase
    .from('user_activity_log')
    .select(
      `id, action, entity_type, entity_id, metadata, created_at, actor_id, target_id,
       actor:profiles!user_activity_log_actor_id_fkey(id, username, full_name),
       target:profiles!user_activity_log_target_id_fkey(id, username, full_name)`
    )
    .or(`actor_id.eq.${userId},target_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ activity: data ?? [] });
}
