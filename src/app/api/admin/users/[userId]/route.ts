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
  if (typeof body?.isAdmin !== 'boolean') {
    return NextResponse.json({ error: 'isAdmin must be a boolean' }, { status: 400 });
  }

  if (userId === admin.userId && !body.isAdmin) {
    return NextResponse.json({ error: 'You cannot remove your own admin access' }, { status: 400 });
  }

  const { data, error } = await admin.supabase
    .from('profiles')
    .update({ is_admin: body.isAdmin })
    .eq('id', userId)
    .select('id, is_admin')
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

  if (userId === admin.userId) {
    return NextResponse.json({ error: 'You cannot ban your own account' }, { status: 400 });
  }

  const { error } = await admin.supabase.auth.admin.deleteUser(userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
