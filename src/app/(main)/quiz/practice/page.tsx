import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import PracticeClient from './PracticeClient';

export const metadata = {
  title: 'Practice Mode — Quiz Mastery',
  description: 'On-demand dharmic knowledge sessions by topic and difficulty.',
};

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; difficulty?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro, tradition, full_name')
    .eq('id', user.id)
    .single();

  if (!profile?.is_pro) {
    redirect('/quiz?upgrade=1');
  }

  const { topic, difficulty } = await searchParams;

  return (
    <PracticeClient
      userId={user.id}
      tradition={profile.tradition ?? 'hindu'}
      initialTopic={topic ?? null}
      initialDifficulty={difficulty ?? null}
    />
  );
}
