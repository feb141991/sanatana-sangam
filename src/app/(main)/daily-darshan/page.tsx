import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import DailyDarshanClient from './DailyDarshanClient';

export default async function DailyDarshanPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('tradition')
    .eq('id', user.id)
    .single();

  return <DailyDarshanClient tradition={profile?.tradition ?? 'Shaiva'} />;
}
