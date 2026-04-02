import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;
  const { postId } = await params;

  const { error } = await admin.supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
