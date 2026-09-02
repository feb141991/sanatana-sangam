import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';
import { ensureAuthProfile } from '@/lib/auth-profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Restores the profile invariant for native sessions created while the
 * auth.users trigger was unavailable or previously failed. The user identity
 * is derived from the bearer/cookie session; callers cannot select an id.
 */
export async function POST(request: NextRequest) {
  const { user } = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await ensureAuthProfile(user);
  if (!profile) {
    return NextResponse.json(
      { error: 'Could not initialise account profile' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.json(
    { onboarding_completed: profile.onboarding_completed },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
