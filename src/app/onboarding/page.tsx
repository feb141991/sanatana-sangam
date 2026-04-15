import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Must be logged in
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('tradition, city, app_language, onboarding_completed')
    .eq('id', user.id)
    .single();

  // If they already finished onboarding, send to home
  if (profile?.onboarding_completed) redirect('/home');

  return (
    <OnboardingClient
      userId={user.id}
      hasTradition={Boolean(profile?.tradition)}
      hasCity={Boolean(profile?.city)}
      hasLanguage={Boolean(profile?.app_language)}
    />
  );
}
