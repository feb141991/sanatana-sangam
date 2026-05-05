import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;
  const { userId } = await params;

  const body = await request.json().catch(() => null);
  
  const updateData: any = {};
  if (typeof body?.isAdmin === 'boolean') updateData.is_admin = body.isAdmin;
  if (typeof body?.isBanned === 'boolean') updateData.is_banned = body.isBanned;
  if (body?.banReason) updateData.ban_reason = body.banReason;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid update fields provided' }, { status: 400 });
  }

  const { data, error } = await admin.supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select('id, is_admin, is_banned, ban_reason')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;
  const { userId } = await params;


  const { error } = await admin.supabase.auth.admin.deleteUser(userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
