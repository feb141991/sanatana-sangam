import { NextRequest, NextResponse } from 'next/server';
import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';
import { nativeProgressWindow } from '@/lib/native-progress-window';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The two Shield counters, with exactly the same source/window as Progress. */
export async function GET(request: NextRequest) {
  const started = performance.now();
  let authMs = 0;
  let queryMs = 0;
  const headers = () => ({
    'Cache-Control': 'private, no-store',
    'Server-Timing': `auth;dur=${authMs.toFixed(2)}, query;dur=${queryMs.toFixed(2)}, total;dur=${(performance.now() - started).toFixed(2)}`,
  });
  try {
    const { user, error, supabase } = await getApiUser(request);
    authMs = performance.now() - started;
    if (error || !user || !supabase) return getApiAuthFailureResponse(error, headers());
    const { today, start182d } = nativeProgressWindow();
    const queryStarted = performance.now();
    const [streak, sessions] = await Promise.all([
      supabase.from('daily_sadhana').select('streak_count').eq('user_id', user.id)
        .gte('date', start182d).lte('date', today).order('date', { ascending: false }).limit(1)
        .maybeSingle<{ streak_count: number | null }>(),
      supabase.from('mala_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);
    queryMs = performance.now() - queryStarted;
    if (streak.error || sessions.error || sessions.count === null) {
      return NextResponse.json({ error: 'Progress temporarily unavailable', code: 'PROGRESS_UNAVAILABLE' },
        { status: 503, headers: { ...headers(), 'Retry-After': '5' } });
    }
    return NextResponse.json({ latestStreakCount: streak.data?.streak_count ?? 0, totalJapaSessions: sessions.count }, { headers: headers() });
  } catch {
    return NextResponse.json({ error: 'Progress temporarily unavailable', code: 'PROGRESS_UNAVAILABLE' },
      { status: 503, headers: { ...headers(), 'Retry-After': '5' } });
  }
}
