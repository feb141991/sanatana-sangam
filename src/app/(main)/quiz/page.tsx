import { createServerSupabaseClient } from '@/lib/supabase-server';
import { localSpiritualDate } from '@/lib/sacred-time';
import { redirect } from 'next/navigation';
import QuizDashboardClient from './QuizDashboardClient';
import { generateActivityGrid } from '@/lib/activity-grid';

export const metadata = {
  title: 'Quiz Mastery — Shoonaya',
  description: 'Deepen your knowledge of dharma, one day at a time.',
};


export default async function QuizPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [profileResult, historyResult, sessionsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('tradition, full_name, is_pro, karma_points, timezone, app_language')
      .eq('id', user.id)
      .single(),
    supabase
      .from('quiz_responses')
      .select('id, date, question, chosen_index, correct_index, is_correct, tradition, explanation')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('quiz_sessions')
      .select('id, topic, difficulty, questions_total, questions_correct, karma_earned, completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(20),
  ]);

  const profile      = profileResult.data;
  const isPro        = profile?.is_pro ?? false;
  const karmaPoints  = (profile as any)?.karma_points ?? 0;
  const tradition    = profile?.tradition ?? 'hindu';
  const userName     = profile?.full_name ?? 'Seeker';
  const timezone     = (profile as { timezone?: string | null } | null)?.timezone ?? 'UTC';
  const appLanguage  = (profile as { app_language?: string | null } | null)?.app_language ?? 'en';
  const history = historyResult.data ?? [];
  const todayStr     = localSpiritualDate(timezone, 4);
  const todayResponse = history.find((item) => item.date === todayStr) ?? null;

  // Gate history: free = 7 days, Pro = full 50
  const visibleHistory = isPro ? history : history.slice(0, 7);

  // Streak grace day logic — use spiritual date to match how quiz dates are recorded
  const yesterdayDate = new Date(todayStr + 'T12:00:00Z');
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
  const missedYesterday = !history.find(h => h.date === yesterdayStr);

  const sevenDaysAgoDate = new Date(todayStr + 'T12:00:00Z');
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
  const sevenDaysAgo = sevenDaysAgoDate.toISOString().split('T')[0];
  const recentHistory = history.filter(h => h.date >= sevenDaysAgo);
  const hasGraceAvailable = recentHistory.length < 7 && missedYesterday;

  // Build 28-day heatmap grid entirely on the server.
  // Each cell: null=missed, 'correct'|'wrong'=answered.
  // Done server-side so no date-string matching or timezone computation happens on the client.
  const dateMap = new Map<string, 'correct' | 'wrong'>();
  for (const h of history) {
    if (!dateMap.has(h.date)) {
      dateMap.set(h.date, h.is_correct ? 'correct' : 'wrong');
    }
  }
  const todayMs = Date.UTC(
    parseInt(todayStr.slice(0, 4)),
    parseInt(todayStr.slice(5, 7)) - 1,
    parseInt(todayStr.slice(8, 10)),
    12, 0, 0
  );
  const heatmapGrid = Array.from({ length: 28 }, (_, i) => {
    const ms = todayMs - (27 - i) * 86_400_000;
    const dateStr = new Date(ms).toISOString().slice(0, 10);
    return {
      dateStr,
      state: dateMap.get(dateStr) ?? null as 'correct' | 'wrong' | null,
      isToday: dateStr === todayStr,
    };
  });

  // Keep activityDates for backward-compat with generateActivityGrid (stats streak calc)
  const activityDates = history.map(h => ({ date: h.date, correct: h.is_correct }));

  return (
    <QuizDashboardClient
      userId={user.id}
      userName={userName}
      tradition={tradition}
      timezone={timezone}
      appLanguage={appLanguage}
      isPro={isPro}
      karmaPoints={karmaPoints}
      todayResponse={todayResponse}
      initialHistory={visibleHistory}
      activityDates={activityDates}
      heatmapGrid={heatmapGrid}
      spiritualToday={todayStr}
      practiceSessions={sessionsResult.data ?? []}
      hasGraceAvailable={hasGraceAvailable}
    />
  );
}
