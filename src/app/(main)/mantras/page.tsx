import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import MantrasClient from './MantrasClient';

export default async function MantrasPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tradition, is_pro')
    .eq('id', user.id)
    .single();

  return (
    <MantrasClient 
      tradition={profile?.tradition || 'hindu'}
      isPro={profile?.is_pro || false}
    />
  );
}
