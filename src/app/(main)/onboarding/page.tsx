import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthUser, getSupabaseClient } from '@/lib/auth-cache';
import { getOnboardingGateProfile, shortUserId } from '@/lib/onboarding-gate';
import OnboardingClient from './OnboardingClient';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const supabase = await getSupabaseClient();
  const { profile, error } = await getOnboardingGateProfile(supabase, user.id);

  const alreadyComplete = profile?.onboarding_completed === true;

  // Temporary gate logging — see ONBOARDING_REDIRECT_LOOP_FOLLOWUP.md (§3-H4).
  // No server redirect here; this gate never bounces to /home.
  console.log('[onboarding-gate]', {
    route: '/onboarding',
    userId: shortUserId(user.id),
    profileFound: Boolean(profile),
    onboarding_completed: profile?.onboarding_completed ?? null,
    readError: Boolean(error),
    willRedirect: false,
  });

  // Already onboarded → render a static "You're all set" state with a plain
  // link to /home. We intentionally do NOT server-redirect to /home: that was
  // the second half of the /home ↔ /onboarding redirect loop.
  if (alreadyComplete) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: 'var(--divine-bg)' }}
      >
        <div
          className="w-full max-w-sm rounded-3xl px-6 py-8"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <h1 className="text-2xl font-bold" style={{ color: 'var(--brand-ink)' }}>
            You&apos;re all set
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--brand-muted)' }}>
            Your onboarding is already complete.
          </p>
          <Link
            href="/home"
            className="mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold"
            style={{ background: 'var(--brand-primary)', color: 'white' }}
          >
            Go to Home
          </Link>
        </div>
      </main>
    );
  }

  // Auto-fill name from waitlist if profile has none yet (preserved behaviour).
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
