import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;
  const { userId } = await params;

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
