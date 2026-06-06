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

  // Auto-fill name from waitlist if profile has none yet
  let initialName = profile?.full_name ?? '';
  if (!initialName && user.email) {
    const { data: waitlistRow } = await supabase
      .from('waitlist')
      .select('name')
      .ilike('email', user.email)
      .maybeSingle();
    if (waitlistRow?.name) initialName = waitlistRow.name;
  }

  return (
    <OnboardingClient
      userId={user.id}
      initialName={initialName}
      initialTradition={profile?.tradition ?? ''}
    />
  );
}
