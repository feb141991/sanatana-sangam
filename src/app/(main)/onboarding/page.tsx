import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, tradition, onboarding_completed')
    .eq('id', user.id)
    .single();

  if (profile?.onboarding_completed) {
    redirect('/home');
  }

  return (
    <OnboardingClient
      userId={user.id}
      initialName={profile?.full_name ?? ''}
      initialTradition={profile?.tradition ?? ''}
    />
  );
}
