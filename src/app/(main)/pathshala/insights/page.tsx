import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import PathshalaInsightsClient from './PathshalaInsightsClient';

export default async function PathshalaInsightsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const [{ data: progress }, { data: profile }] = await Promise.all([
    supabase
      .from('guided_path_progress')
      .select('path_id, status, completed_at, current_lesson, completed_lessons, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),

    supabase
      .from('profiles')
      .select('tradition')
      .eq('id', user.id)
      .single(),
  ]);

  return (
    <PathshalaInsightsClient
      progress={progress ?? []}
      tradition={profile?.tradition ?? 'hindu'}
    />
  );
}
