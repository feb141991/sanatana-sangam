import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import ShieldsClient from './ShieldsClient';

export default async function ShieldsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const [{ data: profile }, { count: totalJapaSessions }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, username, tradition')
      .eq('id', user.id)
      .single(),

    supabase
      .from('mala_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  // Get streak from latest daily_sadhana row
  const { data: latestSadhana } = await supabase
    .from('daily_sadhana')
    .select('streak_count')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  const streak = latestSadhana?.streak_count ?? 0;

  return (
    <ShieldsClient
      streak={streak}
      totalJapaSessions={totalJapaSessions ?? 0}
      userName={profile?.full_name ?? profile?.username ?? 'Sanatani'}
    />
  );
}
