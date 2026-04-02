import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createServiceRoleSupabaseClient } from '@/lib/admin';
import { canSendOneSignalPush, sendOneSignalPush } from '@/lib/onesignal-server';

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const serviceSupabase = createServiceRoleSupabaseClient();
    const createdAt = new Date();
    const title = 'Test notification from Sanatana Sangam';
    const body = 'If you can see this in the bell or as a browser push, notifications are wired correctly.';

    const { error: insertError } = await serviceSupabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title,
        body,
        emoji: '🔔',
        type: 'general',
        action_url: '/profile',
      });

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
      url: '/profile',
      data: {
        type: 'test',
        created_at: createdAt.toISOString(),
      },
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
