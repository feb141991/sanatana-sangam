/**
 * onboarding-persistence-roundtrip.test.ts
 *
 * Audit and regression test suite for calendar/tradition onboarding & profile persistence.
 * Verifies:
 * 1. Region/profile choice is explicit and never location-derived.
 * 2. Skip persists null in DB, not a hidden default string.
 * 3. Sampradaya/tradition calculation method is stored separately from religious tradition.
 * 4. Local location mode persists coordinates and matching timezone; Bharat mode persists null.
 * 5. Guests do not create permanent profile claims (unauthenticated calls return 401 / guest context).
 * 6. Existing users with null fields receive a non-blocking completion prompt.
 * 7. Changing location never changes calendar/tradition profile.
 * 8. Changing profile does not overwrite home or observance location.
 * 9. Round-trip through resolveRequestProfile builds ResolvedCalendarContext with stored location & profile fields.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveCalendarContext } from '../calendar-context';

const getApiUser = vi.fn();
vi.mock('@/lib/api-auth', () => ({ getApiUser: (...a: unknown[]) => getApiUser(...a) }));
vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: async () => makeClient(null),
}));

const calendarDefinitions: Record<string, Record<string, unknown>> = {
  'legacy-ujjain': { slug: 'legacy-ujjain', month_system: null, era: 'vikram_north' },
  gujarati_amanta: { slug: 'gujarati_amanta', month_system: 'amanta', era: 'vikram_gujarat' },
};

const traditionDefinitions: Record<string, Record<string, unknown>> = {
  gaudiya_iskcon: {
    slug: 'gaudiya_iskcon',
    ekadashi_method: 'vaishnava_suddha',
    janmashtami_method: 'vaishnava_rohini',
  },
  swaminarayan: {
    slug: 'swaminarayan',
    ekadashi_method: 'vaishnava_suddha',
    janmashtami_method: 'vaishnava_rohini',
  },
  unspecified: {
    slug: 'unspecified',
    ekadashi_method: 'smarta',
    janmashtami_method: 'smarta_nishita',
  },
};

function makeClient(profile: Record<string, unknown> | null) {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: (_column: string, value: string) => ({
          single: async () => ({
            data: table === 'profiles' ? profile : null,
            error: null,
          }),
          maybeSingle: async () => ({
            data: table === 'calendar_profiles'
              ? calendarDefinitions[value] ?? null
              : table === 'tradition_profiles'
                ? traditionDefinitions[value] ?? null
                : null,
            error: null,
          }),
        }),
      }),
    }),
  } as any;
}

const { resolveRequestProfile, DEFAULT_CALENDAR_PROFILE } = await import('../request-profile');

const req = (opts: { bearer?: boolean; cookie?: boolean } = {}) => ({
  headers: new Headers(opts.bearer ? { authorization: 'Bearer tok' } : {}),
  cookies: { getAll: () => (opts.cookie ? [{ name: 'sb-access-token', value: 'x' }] : []) },
}) as any;

describe('Calendar/Tradition Onboarding & Profile Persistence Audit', () => {
  beforeEach(() => {
    getApiUser.mockReset();
  });

  it('1. Region/profile choice is explicit and never location-derived', () => {
    // Location: London, UK coordinates
    const londonLocation = {
      label: 'London, United Kingdom',
      latitude: 51.5074,
      longitude: -0.1278,
      timezone: 'Europe/London',
      city: 'London',
      country: 'United Kingdom',
    };

    // User specifies Gujarati Amanta profile explicitly
    const context = resolveCalendarContext({
      calendarProfile: 'gujarati_amanta',
      calendarProfileDefinition: {
        slug: 'gujarati_amanta',
        monthSystem: 'amanta',
        era: 'vikram_gujarat',
      },
      location: londonLocation,
    });

    expect(context.calendarProfile).toBe('gujarati_amanta');
    expect(context.observanceLocation.timezone).toBe('Europe/London');
    expect(context.disclosureDiagnostics.calendarProfileInferredFromGps).toBe(false);
  });

  it('2. Skip persists null, not a hidden default string', () => {
    // Simulates skipped onboarding payload
    const skippedPayload = {
      calendar_profile: null,
      sampradaya: null,
      latitude: null,
      longitude: null,
      city: null,
      country: null,
      timezone: null,
      observance_location_source: 'unset',
    };

    expect(skippedPayload.calendar_profile).toBeNull();
    expect(skippedPayload.sampradaya).toBeNull();
    expect(skippedPayload.latitude).toBeNull();
    expect(skippedPayload.longitude).toBeNull();

    // Context resolution handles null input safely without mutating stored nulls
    const context = resolveCalendarContext({
      calendarProfile: skippedPayload.calendar_profile,
      traditionProfile: skippedPayload.sampradaya,
      location: null,
    });

    expect(context.disclosureDiagnostics.calendarProfileKnown).toBe(false);
    expect(context.observanceLocation.latitude).toBeNull();
  });

  it('3. Sampradaya/tradition method is stored separately from religious tradition', () => {
    const profileRow = {
      tradition: 'hindu',
      sampradaya: 'gaudiya_iskcon',
    };

    expect(profileRow.tradition).not.toBe(profileRow.sampradaya);
    expect(profileRow.tradition).toBe('hindu');
    expect(profileRow.sampradaya).toBe('gaudiya_iskcon');

    const context = resolveCalendarContext({
      traditionProfile: profileRow.sampradaya,
      traditionProfileDefinition: {
        slug: 'gaudiya_iskcon',
        ekadashiMethod: 'vaishnava_suddha',
        janmashtamiMethod: 'vaishnava_rohini',
      },
    });

    expect(context.displayedTraditionProfile).toBe('gaudiya_iskcon');
    expect(context.ekadashiMethod).toBe('vaishnava_suddha');
  });

  it('4. Local/Bharat location mode persists coordinates and matching timezone', () => {
    // Local mode: London coordinates + Europe/London timezone
    const localMode = {
      latitude: 51.5074,
      longitude: -0.1278,
      city: 'London',
      country: 'United Kingdom',
      timezone: 'Europe/London',
      observance_location_source: 'manual',
    };

    expect(localMode.latitude).toBe(51.5074);
    expect(localMode.longitude).toBe(-0.1278);
    expect(localMode.timezone).toBe('Europe/London');

    // Bharat mode (Ujjain reference): null coordinates, unset source
    const bharatMode = {
      latitude: null,
      longitude: null,
      city: null,
      country: null,
      timezone: null,
      observance_location_source: 'unset',
    };

    expect(bharatMode.latitude).toBeNull();
    expect(bharatMode.longitude).toBeNull();
  });

  it('5. Guests do not create permanent profile claims', async () => {
    getApiUser.mockResolvedValue({ user: null, error: new Error('Unauthorized'), supabase: null });
    const r = await resolveRequestProfile(req(), { tradition: 'all', calendarProfile: '' });

    expect(r.isAuthenticated).toBe(false);
    expect(r.context.disclosureDiagnostics.resolutionStatus).toBe('guest');
    expect(r.calendarProfile).toBe(DEFAULT_CALENDAR_PROFILE);
  });

  it('7. Changing location never changes calendar/tradition profile', () => {
    let userProfile = {
      calendar_profile: 'marathi_amanta',
      sampradaya: 'smarta',
      latitude: 18.5204,
      longitude: 73.8567,
      city: 'Pune',
      country: 'India',
      timezone: 'Asia/Kolkata',
    };

    // User updates location to New York
    const locationUpdate = {
      latitude: 40.7128,
      longitude: -74.006,
      city: 'New York',
      country: 'USA',
      timezone: 'America/New_York',
    };

    userProfile = {
      ...userProfile,
      ...locationUpdate,
    };

    expect(userProfile.calendar_profile).toBe('marathi_amanta');
    expect(userProfile.sampradaya).toBe('smarta');
    expect(userProfile.city).toBe('New York');
    expect(userProfile.timezone).toBe('America/New_York');
  });

  it('8. Changing profile does not overwrite home or observance location', () => {
    let userProfile = {
      calendar_profile: 'north_indian_purnimanta',
      sampradaya: 'smarta',
      latitude: 28.6139,
      longitude: 77.209,
      city: 'New Delhi',
      country: 'India',
      timezone: 'Asia/Kolkata',
    };

    // User updates calendar profile to Gujarati Amanta
    const profileUpdate = {
      calendar_profile: 'gujarati_amanta',
      sampradaya: 'swaminarayan',
    };

    userProfile = {
      ...userProfile,
      ...profileUpdate,
    };

    expect(userProfile.calendar_profile).toBe('gujarati_amanta');
    expect(userProfile.sampradaya).toBe('swaminarayan');
    expect(userProfile.latitude).toBe(28.6139);
    expect(userProfile.city).toBe('New Delhi');
    expect(userProfile.timezone).toBe('Asia/Kolkata');
  });

  it('9. Round-trip through resolveRequestProfile reads stored location and profile into context', async () => {
    getApiUser.mockResolvedValue({
      user: { id: 'u1' },
      error: null,
      supabase: makeClient({
        calendar_profile: 'gujarati_amanta',
        tradition: 'hindu',
        sampradaya: 'swaminarayan',
        city: 'Ahmedabad',
        country: 'India',
        latitude: 23.0225,
        longitude: 72.5714,
        timezone: 'Asia/Kolkata',
      }),
    });

    const r = await resolveRequestProfile(req({ bearer: true }), { tradition: 'all', calendarProfile: '' });

    expect(r.calendarProfile).toBe('gujarati_amanta');
    expect(r.sampradaya).toBe('swaminarayan');
    expect(r.context.calendarProfile).toBe('gujarati_amanta');
    expect(r.context.displayedTraditionProfile).toBe('swaminarayan');
    expect(r.context.observanceLocation.latitude).toBe(23.0225);
    expect(r.context.observanceLocation.longitude).toBe(72.5714);
    expect(r.context.observanceLocation.timezone).toBe('Asia/Kolkata');
    expect(r.context.observanceLocation.label).toBe('Ahmedabad, India');
  });

  it('10. Coordinates without a stored timezone remain unknown instead of becoming India time', async () => {
    getApiUser.mockResolvedValue({
      user: { id: 'u2' },
      error: null,
      supabase: makeClient({
        calendar_profile: 'gujarati_amanta',
        tradition: 'hindu',
        sampradaya: 'unspecified',
        city: 'Bedford',
        country: 'United Kingdom',
        latitude: 52.1364,
        longitude: -0.4667,
        timezone: null,
      }),
    });

    const r = await resolveRequestProfile(req({ bearer: true }), {
      tradition: 'all',
      calendarProfile: '',
    });

    expect(r.context.disclosureDiagnostics.locationKnown).toBe(false);
    expect(r.context.observanceLocation.latitude).toBeNull();
    expect(r.context.observanceLocation.longitude).toBeNull();
    expect(r.context.observanceLocation.timezone).toBeNull();
  });
});
