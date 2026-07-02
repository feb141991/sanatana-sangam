import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/** Minimal profile shape both onboarding gates (/home and /onboarding) read. */
export type OnboardingGateProfile = Pick<
  ProfileRow,
  'id' | 'full_name' | 'tradition' | 'onboarding_completed'
>;

export interface OnboardingGateResult {
  profile: OnboardingGateProfile | null;
  error: unknown;
}

/**
 * Lower-cardinality id for temporary gate-log correlation. Avoids persisting a
 * full user id in logs while still letting us trace a single user's requests.
 */
export function shortUserId(id: string): string {
  return id.slice(0, 8);
}

/**
 * Shared onboarding-gate profile read used by `/home` and `/onboarding` so both
 * routes decide from the identical query and client path — see
 * `ONBOARDING_REDIRECT_LOOP_FOLLOWUP.md`.
 *
 * Uses `.maybeSingle()` so a missing/unreadable row comes back as a clean
 * `null` (with the DB error surfaced separately) instead of a thrown error.
 *
 * Callers MUST NOT treat `null`/error as "needs onboarding".
 * `onboarding_completed` is `NOT NULL DEFAULT false`, so a successfully read row
 * is always `true` or `false`; a `null` here means the row was *not read*, not
 * that the user is new. Only a definitively read `false` means the user still
 * has to onboard. Treating `null` as "needs onboarding" is exactly what caused
 * the `/home` ↔ `/onboarding` redirect loop.
 */
export async function getOnboardingGateProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<OnboardingGateResult> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, tradition, onboarding_completed')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[onboarding-gate] profile read failed', {
      userId: shortUserId(userId),
      message: error.message,
    });
  }

  return { profile: data ?? null, error: error ?? null };
}
