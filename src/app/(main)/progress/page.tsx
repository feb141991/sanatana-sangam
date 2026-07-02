import { createServerSupabaseClient } from '@/lib/supabase-server';
import { localSpiritualDate } from '@/lib/sacred-time';
import { redirect } from 'next/navigation';
import ProgressClient from './ProgressClient';
import { malaSessionDate } from '@/lib/mala-sessions';

export const metadata = {
  title: 'My Progress — Shoonaya',
  description: 'Track your spiritual journey and karma earned.',
};

export default async function ProgressPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [profileResult, quizResponsesResult, quizSessionsResult, malaSessionsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('tradition, full_name, karma_points, timezone')
      .eq('id', user.id)
      .single(),
    supabase
      .from('quiz_responses')
      .select('date, is_correct')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(300),
    supabase
      .from('quiz_sessions')
      .select('completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(300),
    supabase
      .from('mala_sessions')
      .select('completed_at, date, spiritual_date')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(300),
  ]);

  const profile = profileResult.data;
  const tradition = profile?.tradition ?? 'hindu';
  const timezone = profile?.timezone ?? 'UTC';
  const karmaPoints = (profile as unknown as { karma_points?: number })?.karma_points ?? 0;
  const userName = profile?.full_name ?? 'Seeker';

  const todayStr = localSpiritualDate(timezone, 4);
  const dailyKarmaMap: Record<string, number> = {};

  // Aggregate quiz responses (+10 correct, +2 attempted)
  for (const resp of (quizResponsesResult.data ?? [])) {
    if (!resp.date) continue;
    const karma = resp.is_correct ? 10 : 2;
    dailyKarmaMap[resp.date] = (dailyKarmaMap[resp.date] ?? 0) + karma;
  }

  // Aggregate practice sessions (+8 each)
  for (const session of (quizSessionsResult.data ?? [])) {
    if (!session.completed_at) continue;
    const date = localSpiritualDate(timezone, 4, new Date(session.completed_at));
    dailyKarmaMap[date] = (dailyKarmaMap[date] ?? 0) + 8;
  }

  // Aggregate mala sessions (+5 each)
  for (const session of (malaSessionsResult.data ?? [])) {
    const rawDate = malaSessionDate(session as any);
    if (!rawDate) continue;
    // We attempt to normalize if it's an ISO string vs YYYY-MM-DD
    let finalDate = rawDate;
    if (session.completed_at) {
      finalDate = localSpiritualDate(timezone, 4, new Date(session.completed_at));
    } else if (rawDate.length > 10) {
      finalDate = localSpiritualDate(timezone, 4, new Date(rawDate));
    }
    dailyKarmaMap[finalDate] = (dailyKarmaMap[finalDate] ?? 0) + 5;
  }

  // Convert to array of { date, totalKarma }
  const dailyKarma = Object.entries(dailyKarmaMap).map(([date, totalKarma]) => ({ date, totalKarma }));
  
  // Calculate total quiz stats for Rank
  const quizHistory = quizResponsesResult.data ?? [];
  const totalQuiz = quizHistory.length;
  const correctQuiz = quizHistory.filter(q => q.is_correct).length;
  const quizAccuracy = totalQuiz > 0 ? Math.round((correctQuiz / totalQuiz) * 100) : 0;
  
  // Create an array of active dates for the 28-day grid
  const activeDates = Array.from(new Set([
    ...quizHistory.map(q => q.date).filter(Boolean),
    ...(quizSessionsResult.data ?? []).map(s => s.completed_at ? localSpiritualDate(timezone, 4, new Date(s.completed_at)) : ''),
    ...(malaSessionsResult.data ?? []).map(s => {
      const d = malaSessionDate(s as any);
      return s.completed_at ? localSpiritualDate(timezone, 4, new Date(s.completed_at)) : d.slice(0, 10);
    }),
  ])).filter(Boolean) as string[];

  return (
    <ProgressClient
      userName={userName}
      tradition={tradition}
      karmaPoints={karmaPoints}
      dailyKarma={dailyKarma}
      totalQuiz={totalQuiz}
      quizAccuracy={quizAccuracy}
      activeDates={activeDates}
      spiritualToday={todayStr}
    />
  );
}
