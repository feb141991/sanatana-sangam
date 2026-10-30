import { NextRequest, NextResponse } from 'next/server';

import { getApiAuthFailureResponse, getApiUser, getDeletedAccountResponse } from '@/lib/api-auth';
import { resolveAuthProfile } from '@/lib/auth-profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Restores the profile invariant for native sessions created while the
 * auth.users trigger was unavailable or previously failed. The user identity
 * is derived from the bearer/cookie session; callers cannot select an id.
 */
export async function POST(request: NextRequest) {
  const { user, error: authError } = await getApiUser(request);
  if (!user) {
    return getApiAuthFailureResponse(authError);
  }

  const outcome = await resolveAuthProfile(user);
  // A deleted account's token still verifies locally; the database says so via
  // the profiles_id_fkey violation. Anything else stays a retryable 503.
  if (outcome.kind === 'user_deleted') return getDeletedAccountResponse();
  if (outcome.kind !== 'ready') {
    return NextResponse.json(
      { error: 'Could not initialise account profile' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.json(
    { onboarding_completed: outcome.profile.onboarding_completed },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
