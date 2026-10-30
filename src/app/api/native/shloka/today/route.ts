import { NextRequest, NextResponse } from 'next/server';

import { getApiAuthFailureResponse, getApiUser, getDeletedAccountResponse } from '@/lib/api-auth';
import { resolveAuthProfile, type AuthProfileOutcome } from '@/lib/auth-profile';
import { buildDailySacredText, type DailySacredTextProfile } from '@/lib/daily-sacred-text';
import { readHomeProfile } from '@/lib/home-profile-read';
import { getDayOfYear } from '@/lib/sacred-texts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Only what buildDailySacredText reads. The Shloka screen needs today's text and
// nothing else, so this route does none of home-summary's calendar, observance,
// sadhana, sankalpa or Dharm Veer work: a slow slice there can no longer hold the
// Shloka screen open (2026-10-30, see AGENTS.md).
const SHLOKA_PROFILE_COLUMNS = 'tradition, app_language, timezone';

/**
 * Today's sacred text for the signed-in seeker. The payload is exactly
 * `sacredText` from /api/native/home-summary, built by the same
 * `buildDailySacredText(profile, getDayOfYear())` call, so the two cannot
 * disagree about which text is today's. The profile is required context (it
 * selects the tradition and language), so an unreadable profile is a retryable
 * 503, never a default tradition.
 */
export async function GET(request: NextRequest) {
  const { user, error, supabase } = await getApiUser(request);
  if (error || !user || !supabase) {
    return getApiAuthFailureResponse(error);
  }

  const repairOutcome: { value: AuthProfileOutcome | null } = { value: null };
  const profileRead = await readHomeProfile<DailySacredTextProfile>({
    read: (signal) => supabase
      .from('profiles')
      .select(SHLOKA_PROFILE_COLUMNS)
      .eq('id', user.id)
      .abortSignal(signal)
      .maybeSingle<DailySacredTextProfile>(),
    repair: async () => {
      repairOutcome.value = await resolveAuthProfile(user, supabase);
      return repairOutcome.value.kind === 'ready' ? repairOutcome.value.profile : null;
    },
  });

  const requestId = request.headers.get('x-request-id');
  if (!profileRead.profile) {
    // Same rule as home-summary: only the database saying the account is gone
    // is a 401; a stall or timeout stays a retryable 503.
    if (repairOutcome.value?.kind === 'user_deleted') {
      return getDeletedAccountResponse(requestId ? { 'X-Request-ID': requestId } : undefined);
    }
    console.error('[shloka-today][profile-unavailable]', {
      status: profileRead.status,
      attempts: profileRead.attempts,
      requestId,
      release: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
    });
    return NextResponse.json(
      { error: 'Profile temporarily unavailable', code: 'PROFILE_UNAVAILABLE' },
      { status: 503, headers: {
        'Cache-Control': 'private, no-store',
        'Retry-After': '5',
        ...(requestId ? { 'X-Request-ID': requestId } : {}),
      } },
    );
  }

  return NextResponse.json(
    { sacredText: buildDailySacredText(profileRead.profile, getDayOfYear()) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
