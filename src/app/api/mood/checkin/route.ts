import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { requireUserNotBanned } from '@/lib/api-guards';

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { user, error: authError } = await requireUserNotBanned(supabase);
    if (authError) return authError;

    const url = new URL(request.url);
    const historyParam = url.searchParams.get('history');
    
    if (historyParam) {
      const days = parseInt(historyParam, 10) || 7;
      const historyStart = new Date();
      historyStart.setHours(0, 0, 0, 0);
      historyStart.setDate(historyStart.getDate() - (days - 1));
      
      const { data, error } = await supabase
        .from('user_mood_checkins')
        .select('created_at, before_mood, session_status')
        .eq('user_id', user.id)
        .gte('created_at', historyStart.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching mood history:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
      }

      // We only care about completed or abandoned/dismissed checkins that had a mood
      const historyMap = new Map<string, string>();
      for (const entry of (data || [])) {
        if (!entry.before_mood) continue;
        const dateStr = entry.created_at.split('T')[0];
        if (!historyMap.has(dateStr)) {
          historyMap.set(dateStr, entry.before_mood);
        }
      }

      const historyResult = Array.from(historyMap.entries()).map(([date, mood]) => ({ date, mood }));
      return NextResponse.json(historyResult);
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
    const { user, error: authError } = await requireUserNotBanned(supabase);
    if (authError) return authError;

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
