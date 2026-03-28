import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import AIChatClient from './AIChatClient';

export default async function AIChatPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, avatar_url, tradition, sampradaya')
    .eq('id', user.id)
    .single();

  return (
    <AIChatClient
      userId={user.id}
      userName={profile?.full_name ?? profile?.username ?? 'Sanatani'}
      tradition={profile?.tradition ?? null}
    />
  );
}
