import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import KoshClient from './KoshClient';

export default async function KoshPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ data: profile }, { data: latestSadhana }] = await Promise.all([
    supabase
      .from('profiles')
      .select('seva_score, shloka_streak, tradition, active_symbol_id')
      .eq('id', user.id)
      .single(),
    supabase
      .from('daily_sadhana')
      .select('streak_count')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const streak = latestSadhana?.streak_count ?? profile?.shloka_streak ?? 0;

  return (
    <KoshClient
      userId={user.id}
      streak={streak}
      sevaScore={profile?.seva_score ?? 0}
      tradition={profile?.tradition ?? 'hindu'}
      activeSymbolId={(profile as { active_symbol_id?: string | null } | null)?.active_symbol_id ?? null}
    />
  );
}
