import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import NityaKarmaClient from './NityaKarmaClient';

export default async function NityaKarmaPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, tradition, life_stage, latitude, longitude')
    .eq('id', user.id)
    .single();

  return (
    <NityaKarmaClient
      userId={user.id}
      userName={profile?.full_name ?? profile?.username ?? 'Sadhak'}
      tradition={profile?.tradition ?? 'hindu'}
      lifeStage={profile?.life_stage ?? null}
    />
  );
}
