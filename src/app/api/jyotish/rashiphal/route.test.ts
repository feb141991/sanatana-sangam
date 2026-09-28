import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ getApiUser: vi.fn() }));
vi.mock('@/lib/api-auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api-auth')>(),
  getApiUser: mocks.getApiUser,
}));

afterEach(() => {
  vi.restoreAllMocks();
  mocks.getApiUser.mockReset();
});

// Builds a chainable Supabase-shaped mock for
// `.from('birth_profiles').select(...).eq(...).eq(...).limit(2)`.
function mockBirthProfilesClient(result: { data: unknown; error: unknown }) {
  const limit = vi.fn().mockResolvedValue(result);
  const eq2 = vi.fn().mockReturnValue({ limit });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const select = vi.fn().mockReturnValue({ eq: eq1 });
  const from = vi.fn().mockReturnValue({ select });
  return { from, _spies: { from, select, eq1, eq2, limit } };
}

function req(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { headers });
}

const REQUEST_URL = 'https://shoonaya.com/api/jyotish/rashiphal?rashi=virgo';

describe('GET /api/jyotish/rashiphal', () => {
  it('never calls getApiUser for a plain anonymous request, and keeps public caching', async () => {
    const { GET } = await import('./route');
    const response = await GET(req(REQUEST_URL));
    expect(mocks.getApiUser).not.toHaveBeenCalled();
    expect(response.headers.get('cache-control')).toBe('public, max-age=3600');
    const body = await response.json();
    expect(body.dashaContextStatus).toBe('not_requested');
    expect(body.dashaContext).toBeNull();
  });

  it('never calls getApiUser for a present-but-malformed (non-Bearer) Authorization header', async () => {
    const { GET } = await import('./route');
    const response = await GET(req(REQUEST_URL, { authorization: 'Basic abc123' }));
    expect(mocks.getApiUser).not.toHaveBeenCalled();
    expect(response.headers.get('cache-control')).toBe('public, max-age=3600');
    expect((await response.json()).dashaContextStatus).toBe('not_requested');
  });

  it('attaches dashaContext when the exactly-one primary profile matches the requested sign and has an active Dasha', async () => {
    const chartData = {
      schemaVersion: 2,
      dasha: { timeline: [{ planet: 'Shani', startDate: '2020-01-01', endDate: '2039-01-01', years: 19, isCurrent: true }] },
    };
    const client = mockBirthProfilesClient({ data: [{ rashi: 'virgo', chart_data: chartData }], error: null });
    mocks.getApiUser.mockResolvedValue({ user: { id: 'user-1' }, error: null, supabase: client });

    const { GET } = await import('./route');
    const response = await GET(req(`${REQUEST_URL}&date=2026-06-15`, { authorization: 'Bearer valid-token' }));
    const body = await response.json();

    expect(body.dashaContextStatus).toBe('available');
    expect(body.dashaContext).toMatchObject({ planet: 'Shani', endDate: '2039-01-01' });
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(client._spies.eq1).toHaveBeenCalledWith('owner_id', 'user-1');
    expect(client._spies.eq2).toHaveBeenCalledWith('is_primary', true);
  });

  it('omits dashaContext when authenticated but viewing a different sign than the primary profile, and still does not cache publicly', async () => {
    // Uses a genuinely valid, active timeline -- if the sign-match check were
    // ever bypassed, this fixture WOULD produce a dashaContext, so this test
    // actually exercises that check rather than passing for an unrelated
    // reason (e.g. an empty timeline that fails regardless of the sign).
    const chartData = {
      schemaVersion: 2,
      dasha: { timeline: [{ planet: 'Shani', startDate: '2020-01-01', endDate: '2039-01-01', years: 19, isCurrent: true }] },
    };
    const client = mockBirthProfilesClient({ data: [{ rashi: 'leo', chart_data: chartData }], error: null });
    mocks.getApiUser.mockResolvedValue({ user: { id: 'user-1' }, error: null, supabase: client });

    const { GET } = await import('./route');
    const response = await GET(req(`${REQUEST_URL}&date=2026-06-15`, { authorization: 'Bearer valid-token' }));
    const body = await response.json();

    expect(body.dashaContextStatus).toBe('unavailable');
    expect(body.dashaContext).toBeNull();
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('returns the generic reading with unavailable status for an expired/invalid bearer token, never an error', async () => {
    mocks.getApiUser.mockResolvedValue({ user: null, error: Object.assign(new Error('bad token'), { status: 401 }), supabase: null });

    const { GET } = await import('./route');
    const response = await GET(req(REQUEST_URL, { authorization: 'Bearer expired-token' }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.dashaContextStatus).toBe('unavailable');
    expect(body.rashi).toBeDefined();
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('returns the generic reading with unavailable status when the auth provider itself is unavailable', async () => {
    mocks.getApiUser.mockResolvedValue({ user: null, error: Object.assign(new Error('auth outage'), { status: 503 }), supabase: null });

    const { GET } = await import('./route');
    const response = await GET(req(REQUEST_URL, { authorization: 'Bearer some-token' }));
    expect(response.status).toBe(200);
    expect((await response.json()).dashaContextStatus).toBe('unavailable');
  });

  it('fails closed and logs a request id + count (never a user id) when more than one primary profile exists', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const client = mockBirthProfilesClient({ data: [{ rashi: 'virgo', chart_data: {} }, { rashi: 'virgo', chart_data: {} }], error: null });
    mocks.getApiUser.mockResolvedValue({ user: { id: 'user-should-never-be-logged' }, error: null, supabase: client });

    const { GET } = await import('./route');
    const response = await GET(req(REQUEST_URL, { authorization: 'Bearer valid-token', 'x-request-id': 'req-123' }));
    expect((await response.json()).dashaContextStatus).toBe('unavailable');

    expect(warnSpy).toHaveBeenCalledWith(
      '[rashiphal] more than one primary birth_profiles row',
      expect.objectContaining({ requestId: 'req-123', count: 2 }),
    );
    const loggedPayload = warnSpy.mock.calls.find((call) => call[0] === '[rashiphal] more than one primary birth_profiles row')?.[1];
    expect(JSON.stringify(loggedPayload)).not.toContain('user-should-never-be-logged');
  });

  it('fails closed and logs only an error code (never error.message) when the birth_profiles read errors outright', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const client = mockBirthProfilesClient({ data: null, error: { code: '42501', message: 'internal schema detail that must never be logged' } });
    mocks.getApiUser.mockResolvedValue({ user: { id: 'user-1' }, error: null, supabase: client });

    const { GET } = await import('./route');
    const response = await GET(req(REQUEST_URL, { authorization: 'Bearer valid-token' }));
    expect((await response.json()).dashaContextStatus).toBe('unavailable');

    expect(warnSpy).toHaveBeenCalledWith('[rashiphal] birth_profiles read failed', expect.objectContaining({ code: '42501' }));
    const loggedPayload = warnSpy.mock.calls.find((call) => call[0] === '[rashiphal] birth_profiles read failed')?.[1];
    expect(JSON.stringify(loggedPayload)).not.toContain('internal schema detail');
  });

  it('degrades gracefully (unavailable, not a 500) when chart_data has a malformed or missing dasha timeline', async () => {
    const client = mockBirthProfilesClient({ data: [{ rashi: 'virgo', chart_data: { schemaVersion: 1 } }], error: null });
    mocks.getApiUser.mockResolvedValue({ user: { id: 'user-1' }, error: null, supabase: client });

    const { GET } = await import('./route');
    const response = await GET(req(REQUEST_URL, { authorization: 'Bearer valid-token' }));
    expect(response.status).toBe(200);
    expect((await response.json()).dashaContextStatus).toBe('unavailable');
  });
});
