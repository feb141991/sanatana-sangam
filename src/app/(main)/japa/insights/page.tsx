import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import InsightsClient from './InsightsClient';

export default async function JapaInsightsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // Pull all mala sessions (up to 1 year back)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const fromDate = oneYearAgo.toISOString().slice(0, 10);

  const { data: sessions } = await supabase
    .from('mala_sessions')
    .select('date, rounds, bead_count, duration_secs, mantra_id, created_at')
    .eq('user_id', user.id)
    .gte('date', fromDate)
    .order('date', { ascending: false });

  return <InsightsClient sessions={sessions ?? []} />;
}
