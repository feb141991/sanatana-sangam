import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import NityaKarmaClient from './NityaKarmaClient';

export default async function NityaKarmaPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, tradition, latitude, longitude, seva_score')
    .eq('id', user.id)
    .single();

  // Pro gating: replace with real subscription check when billing is wired
  const isPro = ((profile as any)?.seva_score ?? 0) >= 500;

  return (
    <NityaKarmaClient
      userId={user.id}
      userName={profile?.full_name ?? profile?.username ?? 'Sadhak'}
      tradition={profile?.tradition ?? 'hindu'}
      isPro={isPro}
    />
  );
}
