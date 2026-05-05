import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = await requireAdminAccess();
  if ('response' in admin) return admin.response;
  const { userId } = await params;

  const body = await request.json().catch(() => null);
  if (!body?.reason) {
    return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
  }

  // 1. Insert warning into DB
  const { error: warningError } = await admin.supabase
    .from('user_warnings')
    .insert({
      user_id: userId,
      admin_name: admin.username,
      reason: body.reason,
      admin_note: body.note ?? null,
    });

  if (warningError) {
    return NextResponse.json({ error: warningError.message }, { status: 500 });
  }

  // 2. Send notification to user
  const { error: notifError } = await admin.supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: '⚠️ Community Warning',
      body: `You have received a warning for: ${body.reason}. Please adhere to our guidelines to avoid suspension.`,
      emoji: '⚠️',
      type: 'general',
    });

  if (notifError) {
    console.error('Failed to send warning notification:', notifError);
    // We don't fail the whole request if notification fails, since the warning is recorded
  }

  return NextResponse.json({ success: true });
}
