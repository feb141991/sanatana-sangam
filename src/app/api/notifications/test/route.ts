import { NextResponse, type NextRequest } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { canSendOneSignalPush, sendOneSignalPush } from '@/lib/onesignal-server';
import { getApiUser } from '@/lib/api-auth';

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

    const pushConfigured = canSendOneSignalPush();
    const pushResult = await sendOneSignalPush({
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
      message: pushConfigured
        ? 'Test notification created. Check your bell and browser push.'
        : 'Test notification created in-app. Add OneSignal server keys to enable browser push.',
      push_configured: pushConfigured,
      push_targets: pushResult.sent,
    });
  } catch (error) {
    console.error('Notification test route crashed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Notification test route crashed' },
      { status: 500 }
    );
  }
}
