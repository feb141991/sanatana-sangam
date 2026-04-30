import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import BhaktiInsightsClient from './BhaktiInsightsClient';

export default async function BhaktiInsightsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const ninetyAgo = new Date();
  ninetyAgo.setDate(ninetyAgo.getDate() - 89);
  const fromDate = ninetyAgo.toISOString().slice(0, 10);

  const [{ data: sessions }, { data: profile }] = await Promise.all([
    // Bhakti mala sessions (same table as Japa — devotional practice)
    supabase
      .from('mala_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', fromDate + 'T00:00:00')   // filter by created_at — always exists
      .order('created_at', { ascending: false }),

    supabase
      .from('profiles')
      .select('tradition, shloka_streak, seva_score')
      .eq('id', user.id)
      .single(),
  ]);

  return (
    <BhaktiInsightsClient
      sessions={sessions ?? []}
      shlokaStreak={profile?.shloka_streak ?? 0}
      sevaScore={profile?.seva_score ?? 0}
      tradition={profile?.tradition ?? 'hindu'}
    />
  );
}
