import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('user_mood_checkins')
      .select('id, before_mood, clicked_action, completed_action, session_status, dismissed, created_at, closed_at')
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching mood status:', error);
      return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
    }

    let hasCompletedToday = false;
    let hasDismissedToday = false;
    let openSession = null;
    let lastCompletedMood = null;

    if (data && data.length > 0) {
      hasDismissedToday = data.some(d => d.dismissed);
      
      const completed = data.filter(d => d.session_status === 'completed');
      if (completed.length > 0) {
        hasCompletedToday = true;
        lastCompletedMood = completed[0].before_mood || null;
      }

      const open = data.find(d => d.session_status === 'open');
      if (open) {
        openSession = {
          id: open.id,
          before_mood: open.before_mood,
          clicked_action: open.clicked_action,
          created_at: open.created_at
        };
      }
    }

    return NextResponse.json({
      hasCompletedToday,
      hasDismissedToday,
      openSession,
      lastCompletedMood
    });
  } catch (error) {
    console.error('Error in /api/mood/checkin GET:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      before_mood,
      source_surface,
      context_need,
      context_time,
      context_type,
      dismissed,
    } = body;

    if (!dismissed && !before_mood) {
      return NextResponse.json({ error: 'Missing before_mood' }, { status: 400 });
    }

    // Before creating a new session, close any existing open ones as abandoned
    try {
      await supabase
        .from('user_mood_checkins')
        .update({ session_status: 'abandoned', closed_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('session_status', 'open');
    } catch (err) {
      console.warn('Failed to clean up old open sessions', err);
    }

    const insertPayload: any = {
      user_id: user.id,
      source_surface,
      session_status: dismissed ? 'dismissed' : 'open',
      closed_at: dismissed ? new Date().toISOString() : null
    };

    if (before_mood) insertPayload.before_mood = before_mood;
    if (context_need) insertPayload.context_need = context_need;
    if (context_time) insertPayload.context_time = context_time;
    if (context_type) insertPayload.context_type = context_type;
    if (typeof dismissed === 'boolean') insertPayload.dismissed = dismissed;

    const { data, error } = await supabase
      .from('user_mood_checkins')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting mood checkin:', error);
      if (error.code === 'PGRST204' || error.code === '42703' || error.message?.includes('does not exist')) {
        return NextResponse.json({ error: 'Database schema is out of date. Please run migration 018.' }, { status: 503 });
      }
      return NextResponse.json({ error: 'Failed to insert mood checkin' }, { status: 500 });
    }

    return NextResponse.json({ checkin_id: data.id });
  } catch (error) {
    console.error('Error in /api/mood/checkin:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
