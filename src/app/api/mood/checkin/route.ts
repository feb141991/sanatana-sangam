import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { assertNotBanned } from '@/lib/api-guards';

// Auth: switched from a cookie-only server client (createServerSupabaseClient
// + requireUserNotBanned) to getApiUser(req), which tries the cookie session
// first (web callers, zero behavior change) and falls back to a Bearer token
// (native callers via lib/api.ts's apiFetch, which never sends cookies).
// Same mechanical fix already applied to /api/native/home-summary,
// /api/native/nitya-karma, /api/japa/complete, /api/vrat/observe, and
// /api/pathshala/progress — see docs/NATIVE_MOOD_PARITY_PLAN.md's
// "Prerequisite: auth layer, not a new feature" section for the full
// rationale. No schema change, no new table.

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getApiUser(request);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message ?? 'Unauthorized' }, { status: 401 });
    }
    const banned = await assertNotBanned(supabase, user.id);
    if (banned) return banned;

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

    // Additive fields for native's minimal check-in surface (does not change
    // any field above, all pre-existing PWA behavior is untouched). Native
    // needs a simple "did the user tell us their mood today" signal — the
    // existing hasCompletedToday/lastCompletedMood pair only reflects rows
    // with session_status === 'completed', which nothing in the current
    // check-in flow (native's minimal card, or PWA's own MoodPulse "Done ✓"
    // button) actually sets; both leave the row as 'open' or 'dismissed'.
    // hasLoggedMoodToday/lastMood instead reflect any row with a non-null
    // before_mood recorded today, regardless of session_status.
    const loggedToday = (data ?? []).find(d => d.before_mood);
    const hasLoggedMoodToday = Boolean(loggedToday);
    const lastMood = loggedToday?.before_mood ?? null;

    return NextResponse.json({
      hasCompletedToday,
      hasDismissedToday,
      openSession,
      lastCompletedMood,
      hasLoggedMoodToday,
      lastMood,
    });
  } catch (error) {
    console.error('Error in /api/mood/checkin GET:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

type MoodCheckinInsert = {
  user_id: string;
  source_surface?: string;
  session_status: 'open' | 'dismissed';
  closed_at: string | null;
  before_mood?: string;
  context_need?: string;
  context_time?: string;
  context_type?: string;
  dismissed?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getApiUser(request);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message ?? 'Unauthorized' }, { status: 401 });
    }
    const banned = await assertNotBanned(supabase, user.id);
    if (banned) return banned;

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

    const insertPayload: MoodCheckinInsert = {
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
