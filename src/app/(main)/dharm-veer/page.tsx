import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getDharmVeerOfTheDay } from '@/lib/dharm-veer-db';
import DharmVeerListClient from './DharmVeerListClient';

export const metadata = {
  title: 'Dharm Veer — Stories of Sacred Courage',
  description: 'Discover the forgotten heroes of Dharma. A new story surfaces every day.',
};

export default async function DharmVeerListPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('tradition')
    .eq('id', user.id)
    .maybeSingle();

  const todayHero = await getDharmVeerOfTheDay(supabase, profile?.tradition ?? null);

  return (
    <DharmVeerListClient
      todayHero={todayHero}
      tradition={profile?.tradition ?? null}
    />
  );
}
