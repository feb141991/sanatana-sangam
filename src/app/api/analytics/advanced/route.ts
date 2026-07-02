import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// ── GET /api/analytics/advanced ───────────────────────────────────────────────
// Zenith-only endpoint. Returns aggregated analytics across all practice
// dimensions: quiz, mood, vrat, karma. Used by the Advanced Analytics section
// on the My Progress page.
// ─────────────────────────────────────────────────────────────────────────────

function daysAgoISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  // Verify pro status
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro, karma_points, seva_score, weekly_seva')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_pro) {
    return NextResponse.json({ error: 'Upgrade to Zenith to access Advanced Analytics.', upgrade_required: true }, { status: 403 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = daysAgoISO(30);
  const sevenDaysAgo = daysAgoISO(7);

  // ── Fetch all data in parallel ────────────────────────────────────────────
  const [
    quizResult,
    moodResult,
    vratResult,
    karmaLedgerResult,
  ] = await Promise.allSettled([
    // Quiz responses — last 30 days
    supabase
      .from('quiz_responses')
      .select('date, is_correct, tradition')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: false }),

    // Mood check-ins — last 30 days
    supabase
      .from('user_mood_checkins')
      .select('before_mood, created_at, dismissed, clicked_action')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo + 'T00:00:00')
      .not('before_mood', 'is', null)
      .order('created_at', { ascending: false }),

    // Vrat observations (from recommendations table)
    supabase
      .from('recommendations')
      .select('date, type, content')
      .eq('user_id', user.id)
      .like('type', 'vrat_obs:%')
      .order('date', { ascending: false }),

    // Karma ledger — best effort, may not exist
    supabase
      .from('karma_ledger')
      .select('created_at, amount, reason')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo + 'T00:00:00')
      .order('created_at', { ascending: false }),
  ]);

  // ── Quiz analytics ────────────────────────────────────────────────────────
  const quizRows = quizResult.status === 'fulfilled' ? (quizResult.value.data ?? []) : [];
  const totalAnswered = quizRows.length;
  const totalCorrect  = quizRows.filter(r => r.is_correct).length;
  const accuracyPct   = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // Last 14 days accuracy (day-by-day)
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const date = d.toISOString().slice(0, 10);
    const dayRows = quizRows.filter(r => r.date === date);
    const total = dayRows.length;
    const correct = dayRows.filter(r => r.is_correct).length;
    return { date, total, correct, accuracy: total > 0 ? Math.round((correct / total) * 100) : null };
  });

  // By-tradition breakdown
  const byTraditionMap: Record<string, { answered: number; correct: number }> = {};
  quizRows.forEach(r => {
    if (!byTraditionMap[r.tradition]) byTraditionMap[r.tradition] = { answered: 0, correct: 0 };
    byTraditionMap[r.tradition].answered++;
    if (r.is_correct) byTraditionMap[r.tradition].correct++;
  });
  const byTradition = Object.entries(byTraditionMap).map(([tradition, s]) => ({
    tradition,
    answered: s.answered,
    correct: s.correct,
    accuracy_pct: s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0,
  })).sort((a, b) => b.answered - a.answered);

  // ── Mood analytics ────────────────────────────────────────────────────────
  const moodRows = moodResult.status === 'fulfilled' ? (moodResult.value.data ?? []) : [];
  const moodCounts: Record<string, number> = {};
  moodRows.forEach(r => {
    const m = r.before_mood;
    if (m) moodCounts[m] = (moodCounts[m] ?? 0) + 1;
  });
  const moodFrequency = Object.entries(moodCounts)
    .map(([mood, count]) => ({ mood, count }))
    .sort((a, b) => b.count - a.count);

  const mostFrequentMood = moodFrequency[0]?.mood ?? null;
  const totalMoodCheckins = moodRows.length;

  // Mood over last 7 days — daily dominant mood
  const last7Mood = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const date = d.toISOString().slice(0, 10);
    const dayMoods = moodRows.filter(r => r.created_at?.startsWith(date));
    const counts: Record<string, number> = {};
    dayMoods.forEach(r => { if (r.before_mood) counts[r.before_mood] = (counts[r.before_mood] ?? 0) + 1; });
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    return { date, mood: dominant, checkins: dayMoods.length };
  });

  // % of checkins that led to an action
  const actionRate = totalMoodCheckins > 0
    ? Math.round((moodRows.filter(r => r.clicked_action).length / totalMoodCheckins) * 100)
    : 0;

  // ── Vrat analytics ────────────────────────────────────────────────────────
  const vratRows = vratResult.status === 'fulfilled' ? (vratResult.value.data ?? []) : [];
  const totalVratsObserved = vratRows.length;

  // Unique vratas
  const uniqueVrats = new Set(vratRows.map(r => r.type.replace('vrat_obs:', ''))).size;

  // Vratas in last 30 days
  const vratsLast30 = vratRows.filter(r => r.date >= thirtyDaysAgo).length;

  // Last 5 vrat observations
  const recentVrats = vratRows.slice(0, 5).map(r => ({
    vrat_id: r.type.replace('vrat_obs:', ''),
    vrat_name: (r.content as any)?.vrat_name ?? r.type.replace('vrat_obs:', ''),
    date: r.date,
    karma_earned: (r.content as any)?.karma_earned ?? 25,
  }));

  // ── Karma analytics ───────────────────────────────────────────────────────
  const ledgerRows = karmaLedgerResult.status === 'fulfilled' ? (karmaLedgerResult.value.data ?? []) : [];

  // Karma by reason
  const karmaByReason: Record<string, number> = {};
  ledgerRows.forEach((r: any) => {
    const reason = r.reason ?? 'other';
    karmaByReason[reason] = (karmaByReason[reason] ?? 0) + (r.amount ?? 0);
  });
  const karmaBreakdown = Object.entries(karmaByReason)
    .map(([reason, total]) => ({ reason, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  // Daily karma over last 14 days
  const dailyKarma = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const date = d.toISOString().slice(0, 10);
    const dayTotal = ledgerRows
      .filter((r: any) => r.created_at?.startsWith(date))
      .reduce((sum: number, r: any) => sum + (r.amount ?? 0), 0);
    return { date, karma: dayTotal };
  });

  const totalKarmaLast30 = ledgerRows.reduce((s: number, r: any) => s + (r.amount ?? 0), 0);
  const hasKarmaLedger   = karmaLedgerResult.status === 'fulfilled' && !karmaLedgerResult.value.error;

  return NextResponse.json({
    // Quiz
    quiz: {
      total_answered: totalAnswered,
      total_correct: totalCorrect,
      accuracy_pct: accuracyPct,
      last_14_days: last14,
      by_tradition: byTradition,
    },
    // Mood
    mood: {
      total_checkins: totalMoodCheckins,
      most_frequent_mood: mostFrequentMood,
      mood_frequency: moodFrequency,
      last_7_days: last7Mood,
      action_rate_pct: actionRate,
    },
    // Vrat
    vrat: {
      total_observed: totalVratsObserved,
      unique_vratas: uniqueVrats,
      last_30_days: vratsLast30,
      recent: recentVrats,
    },
    // Karma
    karma: {
      current_total: profile.karma_points ?? 0,
      seva_score: profile.seva_score ?? 0,
      weekly_seva: profile.weekly_seva ?? 0,
      last_30_days_earned: totalKarmaLast30,
      breakdown: karmaBreakdown,
      daily_trend: dailyKarma,
      has_ledger: hasKarmaLedger,
    },
  }, { headers: { 'Cache-Control': 'private, max-age=300' } });
}
