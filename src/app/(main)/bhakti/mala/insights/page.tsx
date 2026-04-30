import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import InsightsClient from '../../../japa/insights/InsightsClient';

export default async function MalaInsightsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const fromDate = oneYearAgo.toISOString().slice(0, 10);

  const { data: sessions, error } = await supabase
    .from('mala_sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', `${fromDate}T00:00:00`)
    .order('created_at', { ascending: false });

  if (error) console.error('[MalaInsights] mala_sessions fetch error:', error.message);

  return <InsightsClient sessions={sessions ?? []} />;
}
