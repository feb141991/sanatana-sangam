import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import JapaClient from './JapaClient';

export default async function JapaPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, tradition')
    .eq('id', user.id)
    .single();

  // Pull today's streak from daily_sadhana
  const today = new Date().toISOString().slice(0, 10);
  const { data: sadhana } = await supabase
    .from('daily_sadhana')
    .select('japa_done, streak_count')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  return (
    <JapaClient
      userId={user.id}
      userName={profile?.full_name ?? profile?.username ?? 'Sadhak'}
      tradition={profile?.tradition ?? 'hindu'}
      currentStreak={sadhana?.streak_count ?? 0}
      japaAlreadyDoneToday={sadhana?.japa_done ?? false}
    />
  );
}
