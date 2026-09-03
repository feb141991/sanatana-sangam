import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { sendPushNotification } from '@/lib/push-server';
import { interpolateTemplate } from '@/lib/notification-templates';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const { titleTemplate, bodyTemplate, sampleVars, targetUserId } = body;

  if (!titleTemplate || !bodyTemplate) {
    return NextResponse.json({ error: 'titleTemplate and bodyTemplate are required' }, { status: 400 });
  }

  const renderedTitle = interpolateTemplate(titleTemplate, sampleVars || {});
  const renderedBody = interpolateTemplate(bodyTemplate, sampleVars || {});

  const supabase = createServiceRoleSupabaseClient();
  let userIds: string[] = [];

  if (targetUserId) {
    userIds = [targetUserId];
  } else {
    // Find any admin user or most recent active user
    const { data: adminUsers } = await supabase
      .from('profiles')
      .select('id')
      .or('role.eq.admin,is_super_admin.eq.true')
      .limit(5);

    userIds = (adminUsers ?? []).map((u) => u.id);
  }

  if (userIds.length === 0) {
    return NextResponse.json({ error: 'No target devices or admin users found to send preview push to.' }, { status: 400 });
  }

  const pushResult = await sendPushNotification({
    userIds,
    title: `[PREVIEW] ${renderedTitle}`,
    body: renderedBody,
    url: '/home',
    data: { type: 'test' },
  });

  return NextResponse.json({
    success: true,
    renderedTitle,
    renderedBody,
    sentToUsers: userIds.length,
    pushResult,
  });
}
