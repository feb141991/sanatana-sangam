import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';

// GET /api/native/progress
//
// Batches the raw row-sets that native's app/my-progress.tsx and
// app/my-progress/shields.tsx used to fetch via 10 separate direct
// `supabase.from(...)` calls (one per screen-load) into a single
// RLS-scoped request. Deliberately returns RAW rows, not pre-aggregated
// stats: my-progress.tsx's heatmap/pillar/streak/day-of-week derivation
// logic (buildHeatmapWeeks, dowCounts from device-local Date().getDay(),
// mala-sessions.ts helpers) stays entirely client-side and unchanged, so
// this route is a pure transport consolidation, not a behavior change.
//
// Deliberately drops 3 fields the previous 10-query fan-out fetched but
// never used in the rendered UI: mandali_posts count, kul_tasks count,
// recommendations (vrat_obs) count. Confirmed dead via grep - dropping
// them is a cleanup, not a regression.
//
// Not built on top of /api/native/progress-summary (Profile-screen-shaped:
// sevaScore/isPro/subscriptionStatus/completion%, single consumer is
// app/(tabs)/profile.tsx) or /api/user/report (ProfileClient's 30-day
// downloadable report: different window for nitya/heatmap, includes
// community post/thread counts My Progress doesn't use, omits the 182-day
// window and 5-pillar daily_sadhana booleans My Progress needs). Neither
// existing route's shape fits without either breaking its current
// consumer or silently changing My Progress's data window - hence one
// new, purpose-built route.
//
// Auth: getApiUser (Bearer for native, cookie for web) - reuses the
// returned client so all reads stay RLS-scoped to the caller's own rows
// (same access every one of these tables already grants the native
// client directly today). No service role.

export const runtime = 'nodejs';

function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getApiUser(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message ?? 'Unauthenticated' }, { status: 401 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const thirtyAgo = daysAgoISO(29);
    const sixMonthsAgo = daysAgoISO(181);

    const [
      { data: profile },
      { data: malaSessions30d },
      { data: nityaLog182d },
      { data: sadhana182d },
      { count: totalJapaSessions },
      { data: karmaLedger30d },
      { data: quizResponses30d },
    ] = await Promise.all([
      supabase.from('profiles').select('full_name, username, karma_points').eq('id', user.id).single(),
      supabase.from('mala_sessions')
        .select('id, count, bead_count, target_count, rounds, duration_seconds, duration_secs, completed_at, created_at, date')
        .eq('user_id', user.id)
        .gte('created_at', thirtyAgo)
        .lte('created_at', today + 'T23:59:59')
        .order('created_at', { ascending: false }),
      supabase.from('nitya_karma_log').select('log_date').eq('user_id', user.id).gte('log_date', sixMonthsAgo).lte('log_date', today),
      supabase.from('daily_sadhana').select('date, japa_done, quiz_done, pathshala_done, dharmveer_done, streak_count').eq('user_id', user.id).gte('date', sixMonthsAgo).lte('date', today),
      supabase.from('mala_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('karma_ledger').select('reason, amount').eq('user_id', user.id).gte('created_at', thirtyAgo).lte('created_at', today + 'T23:59:59'),
      supabase.from('quiz_responses').select('date, is_correct').eq('user_id', user.id).gte('date', thirtyAgo).lte('date', today),
    ]);

    return NextResponse.json(
      {
        profile: profile ?? null,
        malaSessions30d: malaSessions30d ?? [],
        nityaLog182d: nityaLog182d ?? [],
        sadhana182d: sadhana182d ?? [],
        totalJapaSessions: totalJapaSessions ?? 0,
        karmaLedger30d: karmaLedger30d ?? [],
        quizResponses30d: quizResponses30d ?? [],
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 });
  }
}
