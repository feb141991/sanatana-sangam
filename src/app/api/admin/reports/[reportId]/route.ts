import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';

const REPORT_STATUSES = ['pending', 'reviewed', 'actioned', 'dismissed'] as const;
const CONTENT_TABLE_BY_TYPE = {
  post: 'posts',
  mandali_post: 'posts',
  kul_message: 'kul_messages',
  thread: 'forum_threads',
  reply: 'forum_replies',
} as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;
  const { reportId } = await params;

  const body = await request.json().catch(() => null);
  const status = body?.status;
  const note = typeof body?.note === 'string' ? body.note.trim() : '';
  const removeContent = body?.removeContent === true;
  const contentType = typeof body?.contentType === 'string' ? body.contentType : '';
  const contentId = typeof body?.contentId === 'string' ? body.contentId : '';

  if (!REPORT_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid report status' }, { status: 400 });
  }

  if (removeContent) {
    const table = CONTENT_TABLE_BY_TYPE[contentType as keyof typeof CONTENT_TABLE_BY_TYPE];
    if (!table || !contentId) {
      return NextResponse.json({ error: 'Unsupported or missing reported content' }, { status: 400 });
    }

    const { error: deleteError } = await admin.supabase
      .from(table)
      .delete()
      .eq('id', contentId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  }

  const { data, error } = await admin.supabase
    .from('content_reports')
    .update({
      status,
      admin_note: note || null,
    })
    .eq('id', reportId)
    .select('id, status, admin_note')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ report: data });
}
