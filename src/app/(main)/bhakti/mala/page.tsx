import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import MalaClient from './MalaClient';

export default async function MalaModePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/signup');

  const { data: sessions } = await supabase
    .from('mala_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(12);

  return <MalaClient userId={user.id} initialSessions={sessions ?? []} />;
}
