/**
 * Resolves which calendar a request should be answered in.
 *
 * WHY THIS IS SHARED
 * ------------------
 * `/calendar/upcoming`, `/month` and `/day` each had their own copy of this
 * logic, and each copy carried the same two defects -- which is the argument for
 * one implementation rather than three:
 *
 * 1. COOKIE-ONLY AUTH. They called `createServerSupabaseClient().auth.getUser()`,
 *    which reads cookies. The native app authenticates with a Bearer token via
 *    `apiFetch`, so `getUser()` returned nothing, the profile was never read, and
 *    EVERY native user silently got `legacy-ujjain` and `tradition: 'all'` no
 *    matter what they had chosen. `getApiUser` already solves this -- it tries
 *    cookies, then Bearer -- and was simply not used here.
 *
 * 2. THE LOOKUP WAS CONDITIONAL. It ran only `if (!calendarProfile || tradition
 *    === 'all')`, so a caller passing both explicitly skipped it entirely and got
 *    `sampradaya: null`. Sampradaya can never come from the query string, so
 *    there was no way for such a caller to supply it. The lookup is now
 *    unconditional for signed-in users: the request may override the profile and
 *    tradition it asks for, but it cannot supply a sampradaya, so that must
 *    always be read from the profile.
 *
 * The returned client is the one that authenticated, per `getApiUser`'s contract,
 * so subsequent reads stay under the caller's own RLS rather than a service role.
 */
import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getApiUser } from '@/lib/api-auth';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { resolveCalendarContext, type ResolvedCalendarContext } from '@/lib/calendar/calendar-context';

export const DEFAULT_CALENDAR_PROFILE = 'legacy-ujjain';

export interface RequestProfile {
  /** The client that authenticated, or an anonymous one. Reuse for reads. */
  supabase: SupabaseClient;
  calendarProfile: string;
  tradition: string;
  sampradaya: string | null;
  /** Pure ResolvedCalendarContext resolved once per request */
  context: ResolvedCalendarContext;
  /** True when a user was resolved -- useful for cache-control decisions. */
  isAuthenticated: boolean;
  /**
   * Credentials were PRESENT but did not authenticate -- an expired or malformed
   * token, say. Distinct from a guest, who sends none.
   *
   * Both used to collapse into "no user", so a signed-in native client whose
   * token had expired was quietly served the default calendar and had no way to
   * discover it needed to refresh. Silently degrading someone's calendar is a
   * worse outcome than telling them to sign in again.
   */
  invalidCredentials: boolean;
  /**
   * The profile READ failed -- a database or RLS fault, not an absent row.
   *
   * A missing row is normal (a user who has set nothing) and correctly falls back
   * to defaults. A failed read is a fault, and answering it with 'legacy-ujjain'
   * presents a guess as the user's own setting.
   */
  profileError: Error | null;
}

export async function resolveRequestProfile(
  request: NextRequest,
  requested: { tradition: string; calendarProfile: string },
): Promise<RequestProfile> {
  const auth = await getApiUser(request);
  // getApiUser returns a null client for anonymous callers; the calendar is
  // readable without signing in, so fall back rather than rejecting.
  const supabase = auth.supabase ?? (await createServerSupabaseClient());

  // Did the caller even attempt to authenticate? getApiUser reports only whether
  // it succeeded, and "guest" and "broken token" need different answers.
  const hasBearer = !!request.headers?.get?.('authorization');
  const hasSessionCookie = (request.cookies?.getAll?.() ?? []).some(c => c.name.startsWith('sb-'));
  const invalidCredentials = !auth.user && (hasBearer || hasSessionCookie);

  let calendarProfile = requested.calendarProfile;
  let tradition = requested.tradition;
  let sampradaya: string | null = null;
  let profileError: Error | null = null;
  let userLocation: any = null;

  if (auth.user) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('calendar_profile, tradition, sampradaya, city, country, latitude, longitude, timezone')
      .eq('id', auth.user.id)
      .single();

    // PGRST116 is `.single()` finding no row -- an ordinary state for a user who
    // has chosen nothing, and correctly handled by the defaults below. Anything
    // else is a real failure and must not masquerade as "user has no settings".
    if (error && (error as { code?: string }).code !== 'PGRST116') {
      profileError = new Error(error.message ?? 'profile read failed');
    }

    if (profile) {
      // Explicit query parameters still win for the two fields a caller can
      // legitimately ask for.
      if (!calendarProfile) calendarProfile = profile.calendar_profile || '';
      if (tradition === 'all') tradition = profile.tradition || 'all';
      // Never overridable from the query string: one user must not be able to
      // request another's sampradaya, and there is no reason to.
      sampradaya = profile.sampradaya || null;
      userLocation = (profile.latitude != null && profile.longitude != null)
        ? {
            label: [profile.city, profile.country].filter(Boolean).join(', ') || 'Custom Location',
            latitude: Number(profile.latitude),
            longitude: Number(profile.longitude),
            timezone: profile.timezone || 'Asia/Kolkata',
            city: profile.city || null,
            country: profile.country || null,
          }
        : null;
    }
  }

  if (!calendarProfile) calendarProfile = DEFAULT_CALENDAR_PROFILE;

  // Resolve pure ResolvedCalendarContext ONCE per request
  const context = resolveCalendarContext({
    calendarProfile: calendarProfile || null,
    traditionProfile: sampradaya || (tradition !== 'all' ? tradition : null),
    location: userLocation,
    isAuthenticated: !!auth.user,
    invalidCredentials,
    dbError: profileError,
  });

  return {
    supabase, calendarProfile, tradition, sampradaya, context,
    isAuthenticated: !!auth.user,
    invalidCredentials,
    profileError,
  };
}

/**
 * Days of over-fetch on each side of the requested window.
 *
 * Profile precedence is decided before the window is applied, so the query has to
 * return rows just outside it. Without the pad, a festival the chosen profile
 * places on 1 September and the legacy fallback places on 31 August would, in an
 * August query, arrive as a legacy row alone -- indistinguishable from "never
 * materialised for this profile", which is what publishes the fallback.
 *
 * 31 days covers a full month-name shift, the largest divergence these profiles
 * express. The cost is bounded: these tables hold hundreds of rows, not millions.
 */
export const PROFILE_RESOLUTION_PAD_DAYS = 31;

/** Shifts a YYYY-MM-DD date string by whole days, in UTC. */
export function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
