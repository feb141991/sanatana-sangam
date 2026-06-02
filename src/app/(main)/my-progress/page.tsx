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
  const sixMonthsAgo = daysAgoISO(181); // 26 full weeks + 1 day buffer

  // Current month boundaries (for premium report)
  const curMonthStart = monthStartISO(0);
  const curMonthEnd   = monthEndISO(0);
  const prevMonthStart = monthStartISO(1);
  const prevMonthEnd   = monthEndISO(1);

  const [
    { data: profile },
    { data: shrutiStats },
    { data: malaCur },
    { data: malaPrev },
    { data: nityaLog },
    { data: sadhana28 },
    { data: sadhana180 },
    { data: nitya180 },
    { count: allTimeSessions },
    { count: mandaliPosts },
    { count: kulTasksCount },
    { data: quizRows30d },
    { count: vratTotal },
    { data: karmaRows },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, username, tradition, is_pro, seva_score, karma_points, weekly_seva, monthly_seva')
      .eq('id', user.id)
      .single(),

    // Shruti (Sanskrit recitation) stats
    supabase
      .from('pathshala_recitation_stats')
      .select('avg_overall_score, avg_uccharan, avg_fluency, scored_count, unique_verses_attempted, certified_count')
      .eq('user_id', user.id)
      .maybeSingle(),

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

    // Daily sadhana — 30 days: japa + quiz + pathshala + dharmveer + perfect_day
    supabase
      .from('daily_sadhana')
      .select('date, japa_done, quiz_done, pathshala_done, dharmveer_done, streak_count, perfect_day_bonus_given')
      .eq('user_id', user.id)
      .gte('date', thirtyAgo)
      .lte('date', today),

    // Daily sadhana — 6 months for GitHub-style heatmap
    supabase
      .from('daily_sadhana')
      .select('date, japa_done')
      .eq('user_id', user.id)
      .gte('date', sixMonthsAgo)
      .lte('date', today),

    // Nitya karma — 6 months
    supabase
      .from('nitya_karma_log')
      .select('log_date')
      .eq('user_id', user.id)
      .gte('log_date', sixMonthsAgo)
      .lte('log_date', today),

    // All-time session count (for achievement shields)
    supabase
      .from('mala_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),

    // Mandali contribution count
    supabase
      .from('mandali_posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', user.id),

    // Kul tasks completed
    supabase
      .from('kul_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', user.id)
      .eq('completed', true),

    // Quiz responses — last 30 days (accuracy + streak)
    supabase
      .from('quiz_responses')
      .select('date, is_correct')
      .eq('user_id', user.id)
      .gte('date', thirtyAgo)
      .lte('date', today),

    // Vrat observations — all time count
    supabase
      .from('recommendations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .like('type', 'vrat_obs:%'),

    // Karma ledger — last 30 days for top sources
    supabase
      .from('karma_ledger')
      .select('reason, amount')
      .eq('user_id', user.id)
      .gte('created_at', thirtyAgo)
      .lte('created_at', today + 'T23:59:59')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  // Build 30-day heatmap (japa + nitya)
  const sadhanaMap: Record<string, boolean> = {};
  (sadhana28 ?? []).forEach(r => { sadhanaMap[r.date] = r.japa_done; });
  const nityaDates = new Set((nityaLog ?? []).map(r => r.log_date));

  // 5-Pillar 30-day completion counts
  const sadhanaRows = sadhana28 ?? [];
  const pillarData = {
    japa:        sadhanaRows.filter(r => r.japa_done).length,
    nitya:       nityaDates.size,
    quiz:        sadhanaRows.filter(r => (r as any).quiz_done).length,
    pathshala:   sadhanaRows.filter(r => (r as any).pathshala_done).length,
    dharmveer:   sadhanaRows.filter(r => (r as any).dharmveer_done).length,
    perfectDays: sadhanaRows.filter(r => (r as any).perfect_day_bonus_given).length,
    window:      Math.min(sadhanaRows.length, 30),
  };

  // Quiz 30d stats
  const quizAnswers = quizRows30d ?? [];
  const quiz30dTotal   = quizAnswers.length;
  const quiz30dCorrect = quizAnswers.filter(r => r.is_correct).length;

  // Karma 30d breakdown (top 5 sources)
  const karmaByReason: Record<string, number> = {};
  for (const row of karmaRows ?? []) {
    if (row.reason) karmaByReason[row.reason] = (karmaByReason[row.reason] ?? 0) + (row.amount ?? 0);
  }
  const karma30dTotal = Object.values(karmaByReason).reduce((s, v) => s + v, 0);
  const karma30dBreakdown = Object.entries(karmaByReason)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([reason, total]) => ({ reason, total }));

  const heatmap = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 29 + i);
    const dt = d.toISOString().slice(0, 10);
    return { date: dt, japa: sadhanaMap[dt] ?? false, nitya: nityaDates.has(dt) };
  });

  // Build 6-month heatmap (26 weeks) for GitHub-style view
  const sadhana180Map: Record<string, boolean> = {};
  (sadhana180 ?? []).forEach(r => { sadhana180Map[r.date] = r.japa_done; });
  const nitya180Dates = new Set((nitya180 ?? []).map(r => r.log_date));

  const sixMonthHeatmap = Array.from({ length: 182 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 181 + i);
    const dt = d.toISOString().slice(0, 10);
    return { date: dt, japa: sadhana180Map[dt] ?? false, nitya: nitya180Dates.has(dt) };
  });

  let sankalpas: any[] = [];
  try {
    const { data } = await supabase
      .from('sankalpas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(12);
    if (data) sankalpas = data;
  } catch (err) {
    // Ignore missing table gracefully
  }

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
      sixMonthHeatmap={sixMonthHeatmap}
      sevaScore={profile?.seva_score}
      karmaPoints={(profile as any)?.karma_points ?? 0}
      weeklySevaScore={profile?.weekly_seva}
      mandaliPostCount={mandaliPosts ?? 0}
      kulTasksDone={kulTasksCount ?? 0}
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
      // 5-Pillar scorecard
      pillarData={pillarData}
      // Quiz 30d
      quiz30dTotal={quiz30dTotal}
      quiz30dCorrect={quiz30dCorrect}
      // Vrat
      vratTotal={vratTotal ?? 0}
      // Karma 30d
      karma30dTotal={karma30dTotal}
      karma30dBreakdown={karma30dBreakdown}
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
      sankalpas={sankalpas}
      shrutiStats={shrutiStats ? {
        avgScore:        Math.round(shrutiStats.avg_overall_score ?? 0),
        avgPronunciation: Math.round(shrutiStats.avg_uccharan ?? 0),
        avgFluency:      Math.round(shrutiStats.avg_fluency ?? 0),
        scoredCount:     shrutiStats.scored_count ?? 0,
        versesAttempted: shrutiStats.unique_verses_attempted ?? 0,
        certified:       shrutiStats.certified_count ?? 0,
      } : null}
    />
  );
}
