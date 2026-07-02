import { NextResponse } from 'next/server';
import { getSafeAuthNext, resolvePostAuthDestination } from '@/lib/auth-destination';
import { ensureAuthProfile } from '@/lib/auth-profile';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = getSafeAuthNext(url.searchParams.get('next'), '/home');
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: error?.message ?? 'Not authenticated' },
      { status: 401 }
    );
  }

  const profile = await ensureAuthProfile(user, supabase);
  const destination = resolvePostAuthDestination(profile, next);

  return NextResponse.json({
    destination,
    profile_found: Boolean(profile),
    onboarding_completed: profile?.onboarding_completed ?? null,
  });
}
