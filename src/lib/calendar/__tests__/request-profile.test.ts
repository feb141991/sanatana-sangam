/**
 * Request-profile resolution: cookie OR Bearer, and an unconditional lookup.
 *
 * The calendar routes previously called `createServerSupabaseClient().auth
 * .getUser()`, which reads COOKIES ONLY. The native app authenticates with a
 * Bearer token via `apiFetch`, so that call returned no user, the profile row was
 * never read, and every native user silently received `legacy-ujjain` and
 * `tradition: 'all'` regardless of what they had chosen. Nothing failed loudly --
 * the code simply fell through to its defaults, which is why it survived.
 *
 * `getApiUser` already handled cookie-then-Bearer and was not being used here, so
 * these tests pin the wiring rather than the token parsing itself.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const getApiUser = vi.fn();
vi.mock('@/lib/api-auth', () => ({ getApiUser: (...a: unknown[]) => getApiUser(...a) }));
vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: async () => makeClient(null),
}));

function makeClientWithError(error: { code: string; message: string }) {
  return {
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null, error }) }) }) }),
  } as any;
}

/** Minimal Supabase stand-in returning one profile row. */
function makeClient(profile: Record<string, unknown> | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: profile, error: null }),
        }),
      }),
    }),
  } as any;
}

const { resolveRequestProfile, DEFAULT_CALENDAR_PROFILE, shiftDate } = await import('../request-profile');

/** Fake request: no credentials unless given. */
const req = (opts: { bearer?: boolean; cookie?: boolean } = {}) => ({
  headers: new Headers(opts.bearer ? { authorization: 'Bearer tok' } : {}),
  cookies: { getAll: () => (opts.cookie ? [{ name: 'sb-access-token', value: 'x' }] : []) },
}) as any;

beforeEach(() => getApiUser.mockReset());

describe('resolveRequestProfile — authentication', () => {
  it('reads the profile for a Bearer-authenticated (native) caller', () => {
    // The regression that mattered: this returned the default for every native
    // user because the lookup was cookie-only.
    getApiUser.mockResolvedValue({
      user: { id: 'u1' },
      error: null,
      supabase: makeClient({ calendar_profile: 'gujarati-amanta', tradition: 'jain', sampradaya: 'digambara' }),
    });

    return resolveRequestProfile(req(), { tradition: 'all', calendarProfile: '' }).then(r => {
      expect(r.calendarProfile).toBe('gujarati-amanta');
      expect(r.tradition).toBe('jain');
      expect(r.sampradaya).toBe('digambara');
      expect(r.isAuthenticated).toBe(true);
    });
  });

  it('falls back to the default profile for an anonymous caller', async () => {
    getApiUser.mockResolvedValue({ user: null, error: new Error('Unauthorized'), supabase: null });
    const r = await resolveRequestProfile(req(), { tradition: 'all', calendarProfile: '' });
    expect(r.calendarProfile).toBe(DEFAULT_CALENDAR_PROFILE);
    expect(r.sampradaya).toBeNull();
    expect(r.isAuthenticated).toBe(false);
  });
});

describe('resolveRequestProfile — the lookup is unconditional', () => {
  beforeEach(() => {
    getApiUser.mockResolvedValue({
      user: { id: 'u1' },
      error: null,
      supabase: makeClient({ calendar_profile: 'gujarati-amanta', tradition: 'hindu', sampradaya: 'vaishnava' }),
    });
  });

  it('still reads sampradaya when the caller passed profile AND tradition explicitly', async () => {
    // The old guard was `if (!calendarProfile || tradition === 'all')`, so this
    // exact combination skipped the lookup and returned sampradaya: null. A
    // caller cannot supply sampradaya via the query string, so there was no way
    // to get it at all.
    const r = await resolveRequestProfile(req(), { tradition: 'sikh', calendarProfile: 'tamil-solar' });
    expect(r.sampradaya).toBe('vaishnava');
  });

  it('lets explicit query parameters win over the stored profile', async () => {
    const r = await resolveRequestProfile(req(), { tradition: 'sikh', calendarProfile: 'tamil-solar' });
    expect(r.calendarProfile).toBe('tamil-solar');
    expect(r.tradition).toBe('sikh');
  });

  it('never takes sampradaya from the request', async () => {
    // Guards the privacy property: one user must not be able to ask for
    // another's sampradaya, so it is profile-only by construction.
    const r = await resolveRequestProfile(
      req(),
      { tradition: 'all', calendarProfile: '', sampradaya: 'smarta' } as any,
    );
    expect(r.sampradaya).toBe('vaishnava');
  });
});

describe('shiftDate', () => {
  it('shifts across month and year boundaries in UTC', () => {
    expect(shiftDate('2026-09-01', -1)).toBe('2026-08-31');
    expect(shiftDate('2026-12-28', 31)).toBe('2027-01-28');
    expect(shiftDate('2028-02-28', 1)).toBe('2028-02-29'); // leap year
  });
});

describe('failures are distinguished, not silently downgraded', () => {
  it('flags a supplied-but-invalid Bearer token instead of pretending it is a guest', async () => {
    // The whole point: a native client whose token expired was quietly served the
    // default calendar with no signal that it needed to refresh. It looked like a
    // guest, and a guest is a legitimate state, so nothing surfaced.
    getApiUser.mockResolvedValue({ user: null, error: new Error('bad jwt'), supabase: null });
    const r = await resolveRequestProfile(req({ bearer: true }), { tradition: 'all', calendarProfile: '' });
    expect(r.invalidCredentials).toBe(true);
    expect(r.isAuthenticated).toBe(false);
  });

  it('flags an invalid session cookie the same way', async () => {
    getApiUser.mockResolvedValue({ user: null, error: new Error('expired'), supabase: null });
    const r = await resolveRequestProfile(req({ cookie: true }), { tradition: 'all', calendarProfile: '' });
    expect(r.invalidCredentials).toBe(true);
  });

  it('does NOT flag a caller who sent no credentials at all', async () => {
    // The distinction that makes the flag useful: a real guest must still be
    // served, or the calendar stops being public.
    getApiUser.mockResolvedValue({ user: null, error: new Error('Unauthorized'), supabase: null });
    const r = await resolveRequestProfile(req(), { tradition: 'all', calendarProfile: '' });
    expect(r.invalidCredentials).toBe(false);
    expect(r.calendarProfile).toBe(DEFAULT_CALENDAR_PROFILE);
  });

  it('reports a profile READ failure rather than defaulting over it', async () => {
    // Returning legacy-ujjain here would present a guess as the user's own
    // setting, which is indistinguishable to the caller from a real answer.
    getApiUser.mockResolvedValue({
      user: { id: 'u1' },
      error: null,
      supabase: makeClientWithError({ code: '42501', message: 'permission denied' }),
    });
    const r = await resolveRequestProfile(req({ bearer: true }), { tradition: 'all', calendarProfile: '' });
    expect(r.profileError).toBeInstanceOf(Error);
  });

  it('treats "no profile row" as an ordinary state, not a failure', async () => {
    // PGRST116 is `.single()` finding nothing -- normal for a user who has chosen
    // nothing. Escalating it would 500 on a perfectly healthy account.
    getApiUser.mockResolvedValue({
      user: { id: 'u1' },
      error: null,
      supabase: makeClientWithError({ code: 'PGRST116', message: 'no rows' }),
    });
    const r = await resolveRequestProfile(req({ bearer: true }), { tradition: 'all', calendarProfile: '' });
    expect(r.profileError).toBeNull();
    expect(r.calendarProfile).toBe(DEFAULT_CALENDAR_PROFILE);
  });
});
