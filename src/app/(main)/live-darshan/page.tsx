import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import LiveDarshanClient from './LiveDarshanClient';

export default async function LiveDarshanPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('tradition')
    .eq('id', user.id)
    .single();

  return <LiveDarshanClient tradition={profile?.tradition ?? 'hindu'} />;
}
