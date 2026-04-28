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

  // Select * so the query never errors if migration-v30 hasn't been run yet.
  // InsightsClient handles both old column names (count, duration_seconds, mantra)
  // and new column names (rounds, bead_count, duration_secs, mantra_id, date).
  const { data: sessions, error: sessErr } = await supabase
    .from('mala_sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', fromDate + 'T00:00:00')   // filter by created_at — always exists
    .order('created_at', { ascending: false });

  if (sessErr) console.error('[JapaInsights] mala_sessions fetch error:', sessErr.message);

  return <InsightsClient sessions={sessions ?? []} />;
}
