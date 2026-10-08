import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { localSpiritualDate } from '@/lib/sacred-time';
import { deriveDenormalizedBirthProfileFields, generateAstroChart } from '@/lib/jyotish/astro-engine';
import { findActiveDashaEntry, RASHI_LIST } from '@/lib/jyotish/rashiphal-data';

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
const NATIVE_V2_URL = `${REQUEST_URL}&contract=2`;

describe('GET /api/jyotish/rashiphal', () => {
  it('never calls getApiUser for an anonymous request and prevents stale spiritual-day cache responses', async () => {
    const { GET } = await import('./route');
    const response = await GET(req(NATIVE_V2_URL));
    expect(mocks.getApiUser).not.toHaveBeenCalled();
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    const body = await response.json();
    expect(body.dashaContextStatus).toBe('not_requested');
    expect(body.dashaContext).toBeNull();
    expect(body.transitHighlights).toHaveLength(6);
    expect(body.transitHighlights.every((highlight: { tone: string }) => highlight.tone === 'neutral')).toBe(true);
    expect(body.gocharSummary).toContain('not a complete Navagraha reading');
    expect(body.spiritualDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(body.lifeReflections).toHaveLength(3);
    expect(body.practiceSteps).toHaveLength(2);
    for (const legacyField of [
      'luckyColor', 'luckyNumber', 'luckyTime', 'karma', 'health', 'love',
      'sadhanaFocus', 'sadhanaPlan', 'beejaMantra', 'beejaFrequency',
    ]) {
      expect(body).not.toHaveProperty(legacyField);
    }
  });

  it('accepts only the English key as the rashi request parameter (any case), not Sanskrit names', async () => {
    const { GET } = await import('./route');
    const accepted: string[] = [];
    for (const rashi of RASHI_LIST) {
      for (const value of [rashi.key, rashi.key.toUpperCase(), ` ${rashi.en} `, rashi.sa]) {
        const response = await GET(req(`https://shoonaya.com/api/jyotish/rashiphal?rashi=${encodeURIComponent(value)}&contract=2`));
        if (response.status === 200) accepted.push(value);
      }
    }
    // 12 signs x 3 English-key spellings accepted; none of the 12 Sanskrit names
    // (the stored-profile vocabulary) is a valid request value.
    expect(accepted).toHaveLength(36);
    for (const rashi of RASHI_LIST) expect(accepted).not.toContain(rashi.sa);
  });

  it('never calls getApiUser for a present-but-malformed (non-Bearer) Authorization header', async () => {
    const { GET } = await import('./route');
    const response = await GET(req(NATIVE_V2_URL, { authorization: 'Basic abc123' }));
    expect(mocks.getApiUser).not.toHaveBeenCalled();
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect((await response.json()).dashaContextStatus).toBe('not_requested');
  });

  it('returns the spiritual date for the requested timezone across the 4 a.m. day boundary', async () => {
    const { GET } = await import('./route');
    // 23:00 UTC is 04:30 in Kolkata on the next civil date, so the 4 a.m.
    // spiritual day is June 15 even though the UTC date is still June 14.
    const requestedAt = new Date('2026-06-14T23:00:00.000Z');
    const response = await GET(req(`${NATIVE_V2_URL}&tz=Asia/Kolkata&date=${encodeURIComponent(requestedAt.toISOString())}`));
    const body = await response.json();

    expect(body.spiritualDate).toBe(localSpiritualDate('Asia/Kolkata', 4, requestedAt));
    expect(body.spiritualDate).toBe('2026-06-15');
  });

  it('rejects malformed dates, unsupported engine dates, and explicitly invalid timezones before auth or database work', async () => {
    const { GET } = await import('./route');

    const malformedDate = await GET(req(`${REQUEST_URL}&date=2026-02-31`));
    expect(malformedDate.status).toBe(400);

    const unsupportedDate = await GET(req(`${REQUEST_URL}&date=2500-01-01`));
    expect(unsupportedDate.status).toBe(400);
    expect((await unsupportedDate.json()).error).toContain('supported Rashiphala calculation range');

    const invalidTimeZone = await GET(req(`${REQUEST_URL}&tz=Not%2FA_Timezone`));
    expect(invalidTimeZone.status).toBe(400);
    expect((await invalidTimeZone.json()).error).toBe('Invalid timezone query parameter');

    const emptyTimeZone = await GET(req(`${REQUEST_URL}&tz=`));
    expect(emptyTimeZone.status).toBe(400);
    expect(mocks.getApiUser).not.toHaveBeenCalled();
  });

  it('keeps the existing v1 response for installed clients and rejects unknown explicit versions', async () => {
    const { GET } = await import('./route');
    const v1 = await GET(req(REQUEST_URL));
    const v1Body = await v1.json();
    expect(v1.status).toBe(200);
    expect(v1Body).toHaveProperty('luckyColor');
    expect(v1Body).toHaveProperty('sadhanaPlan');
    expect(v1Body).not.toHaveProperty('lifeReflections');

    const unsupported = await GET(req(`${REQUEST_URL}&contract=3`));
    expect(unsupported.status).toBe(400);
  });

  it('matches a real stored Sanskrit Chandra-rashi name (Makara) to the requested English sign', async () => {
    const chartData = {
      schemaVersion: 2,
      dasha: { timeline: [{ planet: 'Shani', startDate: '2020-01-01', endDate: '2039-01-01' }] },
    };
    const client = mockBirthProfilesClient({ data: [{ rashi: 'Makara', chart_data: chartData }], error: null });
    mocks.getApiUser.mockResolvedValue({ user: { id: 'user-1' }, error: null, supabase: client });
    const localeSpy = vi.spyOn(Date.prototype, 'toLocaleDateString');

    const { GET } = await import('./route');
    const response = await GET(req(
      'https://shoonaya.com/api/jyotish/rashiphal?rashi=Capricorn&date=2026-06-15&contract=2',
      { authorization: 'Bearer valid-token' },
    ));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.dashaContextStatus).toBe('available');
    expect(body.dashaContext).toMatchObject({ planet: 'Shani', endDate: '2039-01-01' });
    expect(body.dashaContext.note).toContain('1 January 2039');
    expect(localeSpy).toHaveBeenCalledWith('en-IN', expect.objectContaining({ timeZone: 'UTC' }));
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

// birth_profiles.rashi is written by chart/route.ts from the chart engine, which
// emits the Sanskrit name ("Makara"), while this route takes the English key
// ("capricorn"). The fixtures above use English keys the real writer never
// produces, which is how a total mismatch went unnoticed: no stored value ever
// matched, so no user could ever receive a Dasha. These use a real chart,
// stored the way the writer stores it.
describe('GET /api/jyotish/rashiphal Dasha matching against what the chart writer really stores', () => {
  const chart = generateAstroChart({ date: '1990-05-17', time: '06:30', lat: 28.6139, lng: 77.209, timezone: 'Asia/Kolkata' });
  const storedRashi = deriveDenormalizedBirthProfileFields(chart).rashi as string;
  // Derived from the Sanskrit column only, so this does not lean on the matcher under test.
  const storedKey = RASHI_LIST.find((rashi) => rashi.sa === storedRashi)?.key as string;
  const DATE = '2026-10-06';

  async function dashaStatus(rowRashi: string, requestedKey: string) {
    const client = mockBirthProfilesClient({ data: [{ rashi: rowRashi, chart_data: chart }], error: null });
    mocks.getApiUser.mockResolvedValue({ user: { id: 'user-1' }, error: null, supabase: client });
    const { GET } = await import('./route');
    const response = await GET(req(`https://shoonaya.com/api/jyotish/rashiphal?rashi=${requestedKey}&date=${DATE}`, { authorization: 'Bearer valid-token' }));
    const body = await response.json();
    return { status: body.dashaContextStatus as string, dashaContext: body.dashaContext as { planet: string } | null };
  }

  it('uses a fixture that is genuinely valid: the writer stores a Sanskrit name, and the chart has an active Dasha on the test date', () => {
    expect(RASHI_LIST.map((rashi) => rashi.sa)).toContain(storedRashi);
    expect(storedKey).toBeDefined();
    expect(storedRashi).not.toBe(storedKey);
    expect(findActiveDashaEntry(chart, new Date(`${DATE}T00:00:00.000Z`))).not.toBeNull();
  });

  it('attaches the Dasha when the user views the sign their real chart stored', async () => {
    const result = await dashaStatus(storedRashi, storedKey);
    expect(result.status).toBe('available');
    expect(result.dashaContext?.planet).toBe(findActiveDashaEntry(chart, new Date(`${DATE}T00:00:00.000Z`))?.planet);
  });

  it('attaches it for exactly one of the 12 signs, the stored one, and for none of the other 11', async () => {
    const outcomes = await Promise.all(RASHI_LIST.map(async (rashi) => ({ key: rashi.key, ...(await dashaStatus(storedRashi, rashi.key)) })));
    expect(outcomes.filter((outcome) => outcome.status === 'available').map((outcome) => outcome.key)).toEqual([storedKey]);
    expect(outcomes.filter((outcome) => outcome.status === 'unavailable')).toHaveLength(11);
  });

  it('matches whichever of the three spellings is stored: Sanskrit as written, lowercased Sanskrit as profiles.rashi holds it, English name or key', async () => {
    const english = RASHI_LIST.find((rashi) => rashi.key === storedKey)?.en as string;
    for (const spelling of [storedRashi, storedRashi.toLowerCase(), english, storedKey]) {
      expect((await dashaStatus(spelling, storedKey)).status, spelling).toBe('available');
    }
  });

  it('still refuses a value that is not a sign at all', async () => {
    expect((await dashaStatus('not-a-sign', storedKey)).status).toBe('unavailable');
  });
});
