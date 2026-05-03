import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import QuizDashboardClient from './QuizDashboardClient';

export const metadata = {
  title: 'Quiz Mastery — Sanatan Sangam',
  description: 'Track your daily spiritual knowledge streak and review your learning history.',
};

export default async function QuizPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile for tradition/name
  const { data: profile } = await supabase
    .from('profiles')
    .select('tradition, full_name')
    .eq('id', user.id)
    .single();

  // Fetch past 50 responses
  const { data: history } = await supabase
    .from('quiz_responses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <QuizDashboardClient 
      userId={user.id}
      userName={profile?.full_name ?? 'Seeker'}
      tradition={profile?.tradition ?? 'hindu'}
      initialHistory={history ?? []}
    />
  );
}
