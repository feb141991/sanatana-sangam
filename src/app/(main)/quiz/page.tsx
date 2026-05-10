import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import QuizDashboardClient from './QuizDashboardClient';

export const metadata = {
  title: 'Quiz Mastery — Sanatan Sangam',
  description: 'Deepen your knowledge of dharma, one day at a time.',
};

export default async function QuizPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [profileResult, historyResult, sessionsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('tradition, full_name, is_pro, karma_points')
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

  // Gate history: free = 7 days, Pro = full 50
  const history = historyResult.data ?? [];
  const visibleHistory = isPro ? history : history.slice(0, 7);

  return (
    <QuizDashboardClient
      userId={user.id}
      userName={userName}
      tradition={tradition}
      isPro={isPro}
      karmaPoints={karmaPoints}
      initialHistory={visibleHistory}
      practiceSessions={sessionsResult.data ?? []}
    />
  );
}
