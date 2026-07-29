import { NextResponse, type NextRequest } from 'next/server';
import { start } from 'workflow/api';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { getApiUser } from '@/lib/api-auth';
import { shouldUseVercelWorkflowRuntime } from '@/lib/workflow-runtime';
import { testNotificationWorkflow } from '@/workflows/push-notifications';

// Cookie session first, Bearer-token fallback second — see getApiUser's own
// doc comment. Needed so the native app's notification-inbox empty state
// ("Send test notification", matching web's HomeDashboard.tsx panel) can
// call this route with apiFetch's Authorization header instead of a cookie.
export async function POST(request: NextRequest) {
  const { user, error } = await getApiUser(request);

  if (!user) {
    return NextResponse.json({ error: error?.message ?? 'Unauthorized' }, { status: 401 });
  }

  try {
    const serviceSupabase = createServiceRoleSupabaseClient();
    const createdAt = new Date();
    const title = 'Test notification from Shoonaya';
    const body = 'If you can see this in the bell or as a browser push, notifications are wired correctly.';
    const actionPath = '/profile';
    const actionUrl = new URL(actionPath, new URL(request.url).origin).toString();

    const { data, error: insertError } = await serviceSupabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title,
        body,
        emoji: '🔔',
        type: 'general',
        action_url: actionPath,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Notification test insert failed:', insertError);
      return NextResponse.json(
        { error: `Could not create test notification: ${insertError.message}` },
        { status: 500 }
      );
    }

    if (shouldUseVercelWorkflowRuntime()) {
      const run = await start(testNotificationWorkflow, [{
        userId: user.id,
        title,
        body,
        actionUrl,
        notificationId: data?.id,
        createdAt: createdAt.toISOString(),
      }]);

      return NextResponse.json({
        message: 'Test notification created. Push delivery workflow queued.',
        push_configured: false,
        push_targets: 0,
        push_queued: true,
        workflowRunId: run.runId,
      });
    }

    const { sendPushNotification } = await import('@/lib/push-server');
    const pushResult = await sendPushNotification({
      userIds: [user.id],
      title,
      body,
      url: actionUrl,
      data: {
        type: 'test',
        created_at: createdAt.toISOString(),
      },
    }, {
      type: 'test',
      notificationIdsByUserId: insertError ? undefined : { [user.id]: data?.id },
    });

    return NextResponse.json({
      message: pushResult.sent > 0
        ? 'Test notification created. Check your bell and push notification.'
        : 'Test notification created in-app, but no push channel reached this account.',
      push_configured: pushResult.sent > 0,
      push_targets: pushResult.sent,
      push_queued: false,
    });
  } catch (error) {
    console.error('Notification test route crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Notification test route crashed' },
      { status: 500 }
    );
  }
}
