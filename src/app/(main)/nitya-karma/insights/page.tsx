import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import NityaInsightsClient from './NityaInsightsClient';

export default async function NityaInsightsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const ninetyAgo = new Date();
  ninetyAgo.setDate(ninetyAgo.getDate() - 89);
  const fromDate = ninetyAgo.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: logs }, { data: profile }] = await Promise.all([
    supabase
      .from('nitya_karma_log')
      .select('log_date, step_id, created_at')
      .eq('user_id', user.id)
      .gte('log_date', fromDate)
      .lte('log_date', today)
      .order('log_date', { ascending: false }),

    supabase
      .from('profiles')
      .select('tradition')
      .eq('id', user.id)
      .single(),
  ]);

  return (
    <NityaInsightsClient
      logs={logs ?? []}
      tradition={profile?.tradition ?? 'hindu'}
    />
  );
}
