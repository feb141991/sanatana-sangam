import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import {
  malaSessionBeads,
  malaSessionDurationSeconds,
  malaSessionMantra,
  malaSessionRounds,
} from '@/lib/mala-sessions';
import MyProgressClient from './MyProgressClient';

// ── Date helpers ──────────────────────────────────────────────────────────────
function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function monthStartISO(monthsBack = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack, 1);
  return d.toISOString().slice(0, 10);
}

function monthEndISO(monthsBack = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack + 1, 0); // last day of that month
  return d.toISOString().slice(0, 10);
}

export default async function MyProgressPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const today        = new Date().toISOString().slice(0, 10);
  const thirtyAgo    = daysAgoISO(29);
  const twentyEight  = daysAgoISO(27);

  // Current month boundaries (for premium report)
  const curMonthStart = monthStartISO(0);
  const curMonthEnd   = monthEndISO(0);
  const prevMonthStart = monthStartISO(1);
  const prevMonthEnd   = monthEndISO(1);

  const [
    { data: profile },
    { data: malaCur },
    { data: malaPrev },
    { data: nityaLog },
    { data: sadhana28 },
    { count: allTimeSessions },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, username, tradition, is_pro')
      .eq('id', user.id)
      .single(),

    // Japa sessions — current month (for report) + last 30d (for dashboard)
    supabase
      .from('mala_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', thirtyAgo)
      .lte('created_at', today + 'T23:59:59')
      .order('created_at', { ascending: false }),

    // Japa sessions — previous calendar month (for month-over-month in report)
    supabase
      .from('mala_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', prevMonthStart)
      .lte('created_at', prevMonthEnd + 'T23:59:59'),

    // Nitya karma — last 30 days
    supabase
      .from('nitya_karma_log')
      .select('log_date')
      .eq('user_id', user.id)
      .gte('log_date', thirtyAgo)
      .lte('log_date', today),

    // Daily sadhana — 28 days for heatmap
    supabase
      .from('daily_sadhana')
      .select('date, japa_done, streak_count')
      .eq('user_id', user.id)
      .gte('date', twentyEight)
      .lte('date', today),

    // All-time session count (for achievement shields)
    supabase
      .from('mala_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  // Build 28-day heatmap
  const sadhanaMap: Record<string, boolean> = {};
  (sadhana28 ?? []).forEach(r => { sadhanaMap[r.date] = r.japa_done; });
  const nityaDates = new Set((nityaLog ?? []).map(r => r.log_date));

  const heatmap = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 27 + i);
    const dt = d.toISOString().slice(0, 10);
    return { date: dt, japa: sadhanaMap[dt] ?? false, nitya: nityaDates.has(dt) };
  });

  // Current streak from most recent sadhana row
  const streak = (sadhana28 ?? []).sort((a, b) => b.date.localeCompare(a.date))[0]?.streak_count ?? 0;

  // Nitya completions last 30 days
  const nityaDaysCount = nityaDates.size;

  // Japa summary — last 30d
  const malaSessions = malaCur ?? [];
  const totalSessions = malaSessions.length;
  const totalRounds   = malaSessions.reduce((s, r) => s + malaSessionRounds(r), 0);
  const totalBeads    = malaSessions.reduce((s, r) => s + malaSessionBeads(r), 0);
  const totalDurationSecs = malaSessions.reduce((s, r) => s + malaSessionDurationSeconds(r), 0);

  // Mantra frequency
  const mantraFreq: Record<string, number> = {};
  malaSessions.forEach(r => {
    const mantra = malaSessionMantra(r);
    if (mantra) mantraFreq[mantra] = (mantraFreq[mantra] ?? 0) + 1;
  });
  const topMantra = Object.entries(mantraFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Day-of-week distribution (0=Sun … 6=Sat)
  const dowCounts = Array(7).fill(0) as number[];
  malaSessions.forEach(r => {
    const dow = new Date(r.created_at).getDay();
    dowCounts[dow]++;
  });

  // Premium report: previous month comparison
  const prevMalaSessions = malaPrev ?? [];
  const prevRounds  = prevMalaSessions.reduce((s, r) => s + malaSessionRounds(r), 0);
  const prevBeads   = prevMalaSessions.reduce((s, r) => s + malaSessionBeads(r), 0);
  const prevSessions = prevMalaSessions.length;

  // Current calendar month — filter from already-fetched malaCur (last 30d always contains current month)
  const curMonthSessions = malaSessions.filter(r => r.created_at >= curMonthStart);
  const curMonthRounds   = curMonthSessions.reduce((s, r) => s + malaSessionRounds(r), 0);
  const curMonthBeads    = curMonthSessions.reduce((s, r) => s + malaSessionBeads(r), 0);

  // Current month Nitya (for report — subset of 30d)
  const curMonthNitya = (nityaLog ?? []).filter(r => r.log_date >= curMonthStart && r.log_date <= curMonthEnd).length;
  const curMonthDays  = new Date().getDate(); // days elapsed in this month

  return (
    <MyProgressClient
      userName={profile?.full_name ?? profile?.username ?? 'Sanatani'}
      tradition={profile?.tradition ?? null}
      isPro={(profile as any)?.is_pro ?? false}
      streak={streak}
      heatmap={heatmap}
      // Japa — 30d dashboard
      japa30dSessions={totalSessions}
      japa30dRounds={totalRounds}
      japa30dBeads={totalBeads}
      japa30dMins={Math.round(totalDurationSecs / 60)}
      topMantra={topMantra}
      dowCounts={dowCounts}
      // Japa — all-time (for achievement shields)
      totalJapaSessions={allTimeSessions ?? 0}
      // Nitya — 30d
      nitya30dDays={nityaDaysCount}
      // Premium report data — current calendar month vs prev month
      report={{
        curMonthStart,
        curMonthEnd,
        curSessions:  curMonthSessions.length,
        curRounds:    curMonthRounds,
        curBeads:     curMonthBeads,
        curNityaDays: curMonthNitya,
        curDaysElapsed: curMonthDays,
        prevSessions,
        prevRounds,
        prevBeads,
        topMantra,
      }}
    />
  );
}
