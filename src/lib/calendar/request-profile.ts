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
import {
  resolveCalendarContext,
  type CalendarEra,
  type CalendarProfileDefinition,
  type EkadashiMethod,
  type JanmashtamiMethod,
  type MonthSystem,
  type ResolvedCalendarContext,
  type TraditionProfileDefinition,
} from '@/lib/calendar/calendar-context';

export const DEFAULT_CALENDAR_PROFILE = 'legacy-ujjain';

export interface RequestProfile {
  /** The client that authenticated, or an anonymous one. Reuse for reads. */
  supabase: SupabaseClient;
  calendarProfile: string;
  tradition: string;
  sampradaya: string | null;
  /**
   * 'major_only' | 'all_observances' | null. Read straight off the profile
   * row, no defaulting here -- null means "no filter", same as today's
   * behaviour for every existing user who has never set this.
   */
  calendarScope: string | null;
  ekadashiMethod: EkadashiMethod;
  /** Pure ResolvedCalendarContext resolved once per request */
  context: ResolvedCalendarContext;
  /** True when a user was resolved -- useful for cache-control decisions. */
  isAuthenticated: boolean;
  /**
   * Credentials were PRESENT but did not authenticate -- an expired or malformed
   * token, say. Distinct from a guest, who sends none.
   */
  invalidCredentials: boolean;
  /**
   * The profile READ failed -- a database or RLS fault, not an absent row.
   * A missing row is normal and falls back to unspecified defaults.
   * A failed read is a fault, returning an explicit API error rather than guessing.
   */
  profileError: Error | null;
}

function toMonthSystem(value: unknown): MonthSystem {
  return value === 'amanta' || value === 'purnimanta' || value === 'solar'
    ? value
    : 'unknown';
}

function toCalendarEra(value: unknown): CalendarEra {
  return value === 'vikram_north' ||
    value === 'vikram_gujarat' ||
    value === 'shaka' ||
    value === 'kollam' ||
    value === 'bengali_san' ||
    value === 'bikram_sambat' ||
    value === 'nanakshahi'
    ? value
    : 'unknown';
}

function toEkadashiMethod(value: unknown): EkadashiMethod {
  return value === 'smarta' || value === 'vaishnava_suddha' ? value : 'unknown';
}

function toJanmashtamiMethod(value: unknown): JanmashtamiMethod {
  return value === 'smarta_nishita' || value === 'vaishnava_rohini' ? value : 'unknown';
}

export async function resolveRequestProfile(
  request: NextRequest,
  requested: { tradition: string; calendarProfile: string },
): Promise<RequestProfile> {
  const auth = await getApiUser(request);
  const supabase = auth.supabase ?? (await createServerSupabaseClient());

  const hasBearer = !!request.headers?.get?.('authorization');
  const hasSessionCookie = (request.cookies?.getAll?.() ?? []).some(c => c.name.startsWith('sb-'));
  const invalidCredentials = !auth.user && (hasBearer || hasSessionCookie);

  let calendarProfile = requested.calendarProfile;
  let tradition = requested.tradition;
  let sampradaya: string | null = null;
  let calendarScope: string | null = null;
  let profileError: Error | null = null;
  let userLocation: any = null;
  let calendarProfileDefinition: CalendarProfileDefinition | null = null;
  let traditionProfileDefinition: TraditionProfileDefinition | null = null;

  if (auth.user) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('calendar_profile, calendar_scope, tradition, sampradaya, city, country, latitude, longitude, timezone')
      .eq('id', auth.user.id)
      .single();

    if (error && (error as { code?: string }).code !== 'PGRST116') {
      profileError = new Error(error.message ?? 'profile read failed');
    }

    if (profile) {
      if (!calendarProfile) calendarProfile = profile.calendar_profile || '';
      if (tradition === 'all') tradition = profile.tradition || 'all';
      sampradaya = profile.sampradaya || null;
      calendarScope = profile.calendar_scope || null;
      userLocation = (
        profile.latitude != null &&
        profile.longitude != null &&
        typeof profile.timezone === 'string' &&
        profile.timezone.trim().length > 0
      )
        ? {
            label: [profile.city, profile.country].filter(Boolean).join(', ') || 'Custom Location',
            latitude: Number(profile.latitude),
            longitude: Number(profile.longitude),
            timezone: profile.timezone.trim(),
            city: profile.city || null,
            country: profile.country || null,
          }
        : null;
    }
  }

  if (!calendarProfile) calendarProfile = DEFAULT_CALENDAR_PROFILE;

  if (!profileError) {
    const targetTraditionSlug = sampradaya || (auth.user && tradition === 'hindu' ? 'unspecified' : null);
    const calendarQuery = supabase
      .from('calendar_profiles')
      .select('slug, month_system, era')
      .eq('slug', calendarProfile)
      .maybeSingle();
    const traditionQuery = targetTraditionSlug
      ? supabase
          .from('tradition_profiles')
          .select('slug, ekadashi_method, janmashtami_method')
          .eq('slug', targetTraditionSlug)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null });

    const [calendarResult, traditionResult] = await Promise.all([calendarQuery, traditionQuery]);

    if (calendarResult.error) {
      profileError = new Error(calendarResult.error.message ?? 'calendar profile read failed');
    } else if (traditionResult.error) {
      profileError = new Error(traditionResult.error.message ?? 'tradition profile read failed');
    } else {
      const calendarRow = calendarResult.data;
      if (calendarRow?.slug) {
        calendarProfileDefinition = {
          slug: calendarRow.slug,
          monthSystem: toMonthSystem(calendarRow.month_system),
          era: toCalendarEra(calendarRow.era),
        };
      }

      const traditionRow = traditionResult.data;
      if (traditionRow?.slug) {
        traditionProfileDefinition = {
          slug: traditionRow.slug,
          ekadashiMethod: toEkadashiMethod(traditionRow.ekadashi_method),
          janmashtamiMethod: toJanmashtamiMethod(traditionRow.janmashtami_method),
        };
      }
    }
  }

  const selectedTraditionProfile = traditionProfileDefinition?.slug ?? null;

  // Resolve pure ResolvedCalendarContext ONCE per request
  const context = resolveCalendarContext({
    calendarProfile: calendarProfile || null,
    traditionProfile: selectedTraditionProfile,
    calendarProfileDefinition: profileError ? null : calendarProfileDefinition,
    traditionProfileDefinition: profileError ? null : traditionProfileDefinition,
    location: userLocation,
    isAuthenticated: !!auth.user,
    invalidCredentials,
    dbError: profileError,
  });

  return {
    supabase,
    calendarProfile,
    tradition,
    sampradaya,
    calendarScope,
    ekadashiMethod: context.ekadashiMethod,
    context,
    isAuthenticated: !!auth.user,
    invalidCredentials,
    profileError,
  };
}

export const PROFILE_RESOLUTION_PAD_DAYS = 31;

export function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
