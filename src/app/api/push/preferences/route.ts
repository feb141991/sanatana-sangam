import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { japa_reminder_enabled, japa_reminder_time } = body;

    const updates: Record<string, any> = {};

    if (japa_reminder_enabled !== undefined) {
      updates.japa_reminder_enabled = !!japa_reminder_enabled;
    }

    if (japa_reminder_time !== undefined) {
      if (typeof japa_reminder_time !== 'string' || !/^\d{2}:\d{2}$/.test(japa_reminder_time)) {
        return NextResponse.json({ error: 'japa_reminder_time must be in HH:MM format' }, { status: 400 });
      }
      updates.japa_reminder_time = japa_reminder_time;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid update parameters provided' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[push/preferences/PATCH] Failed:', err);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
