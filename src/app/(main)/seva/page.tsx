import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import SevaClient from './SevaClient';

export default async function SevaPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, tradition')
    .eq('id', user.id)
    .single();

  return (
    <SevaClient 
      userId={user.id} 
      userName={profile?.full_name ?? profile?.username ?? 'Sanatani'} 
      tradition={profile?.tradition ?? 'hindu'} 
    />
  );
}
