/**
 * /calendar/month and /calendar/day must filter by tradition in SQL.
 *
 * Only /calendar/upcoming ever did. The other two selected
 * `observance_definitions.tradition` as a COLUMN and never filtered on it, so a
 * Sikh user's month view contained Jain and Buddhist observances and vice versa.
 *
 * It survived because the formatter took `requestedTradition` and appeared to use
 * it -- for variant selection, which is a different question entirely. I then
 * wrote a comment asserting "tradition filtering happens in the SQL", which was
 * true of one route out of three. This asserts it of all of them.
 *
 * Written against the query builder rather than the response, because the point
 * is that the database is asked to filter: pulling every tradition back and
 * discarding it in JS would satisfy a response-level assertion while still
 * shipping other traditions' data over the wire.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

interface Call { table: string; method: string; args: unknown[] }
let calls: Call[] = [];

const attachBatchesMock = vi.hoisted(() => vi.fn(
  async (
    rows: Array<Record<string, unknown>>,
    _admin?: unknown,
    _requestedCalendarProfile?: string | null,
    _requestedLocation?: unknown,
  ) => rows.map(row => ({ ...row, batch: null })),
));

/** Chainable, thenable recorder standing in for a Supabase query builder. */
function recorder(table: string): any {
  const chain: any = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop === 'then') {
          return (resolve: (v: unknown) => void) => resolve({ data: [], error: null });
        }
        return (...args: unknown[]) => {
          calls.push({ table, method: prop, args });
          return chain;
        };
      },
    },
  );
  return chain;
}

const fakeSupabase = { from: (table: string) => recorder(table) } as any;

vi.mock('@/lib/calendar/request-profile', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../request-profile')>();
  return {
    ...actual,
    resolveRequestProfile: async (_req: unknown, requested: { tradition: string; calendarProfile: string }) => ({
      supabase: fakeSupabase,
      calendarProfile: requested.calendarProfile || 'legacy-ujjain',
      tradition: requested.tradition,
      sampradaya: null,
      isAuthenticated: true,
      invalidCredentials: false,
      profileError: null,
      context: {
        effectiveCalculationLocation: {
          latitude: 23.1765,
          longitude: 75.7885,
          timezone: 'Asia/Kolkata',
        },
      },
    }),
  };
});

vi.mock('@/lib/calendar/occurrence-reader', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../occurrence-reader')>();
  return {
    ...actual,
    attachMaterialisationBatches: attachBatchesMock,
  };
});

const { GET: monthGET } = await import('@/app/api/calendar/month/route');
const { GET: dayGET } = await import('@/app/api/calendar/day/route');
const { GET: upcomingGET } = await import('@/app/api/calendar/upcoming/route');

const request = (url: string) => ({ nextUrl: new URL(url) }) as any;

const traditionFilters = () =>
  calls.filter(c => c.method === 'in' && c.args[0] === 'observance_definitions.tradition');

const occurrenceSelect = () => {
  const call = calls.find(c => c.table === 'observance_occurrences' && c.method === 'select');
  return String(call?.args[0] ?? '');
};

beforeEach(() => {
  calls = [];
  attachBatchesMock.mockClear();
});

describe('tradition filtering reaches the database', () => {
  it('month filters occurrences AND the review queue', async () => {
    await monthGET(request('http://t/api/calendar/month?year=2026&month=9&tradition=sikh'));
    const filters = traditionFilters();
    expect(filters.map(f => f.table).sort()).toEqual([
      'observance_occurrences',
      'observance_review_queue',
    ]);
    expect(filters[0].args[1]).toEqual(['sikh', 'all']);
  });

  it('day filters occurrences AND the review queue', async () => {
    await dayGET(request('http://t/api/calendar/day?date=2026-09-04&tradition=jain'));
    const filters = traditionFilters();
    expect(filters.map(f => f.table).sort()).toEqual([
      'observance_occurrences',
      'observance_review_queue',
    ]);
    expect(filters[0].args[1]).toEqual(['jain', 'all']);
  });

  it("does not filter when the caller asks for 'all'", async () => {
    // 'all' is not a tradition; filtering on it would return nothing.
    await monthGET(request('http://t/api/calendar/month?year=2026&month=9&tradition=all'));
    expect(traditionFilters()).toHaveLength(0);
  });
});

describe('the padded fetch reaches the database', () => {
  it('month queries wider than the month it returns', async () => {
    // Profile resolution needs to see rows outside the window; without the pad
    // the fallback fires for a festival the profile placed just over the edge.
    await monthGET(request('http://t/api/calendar/month?year=2026&month=9&tradition=all'));
    const gte = calls.find(c => c.method === 'gte' && c.args[0] === 'date');
    const lte = calls.find(c => c.method === 'lte' && c.args[0] === 'date');
    expect(gte!.args[1] as string < '2026-09-01').toBe(true);
    expect(lte!.args[1] as string > '2026-09-30').toBe(true);
  });

  it('day queries a range, not a single equality', async () => {
    await dayGET(request('http://t/api/calendar/day?date=2026-09-04&tradition=all'));
    expect(calls.some(c => c.method === 'eq' && c.args[0] === 'date')).toBe(false);
    expect(calls.some(c => c.method === 'gte' && c.args[0] === 'date')).toBe(true);
  });
});

describe('withheld occurrences stay filtered at the database', () => {
  it('both routes require publication_status = published', async () => {
    await monthGET(request('http://t/api/calendar/month?year=2026&month=9&tradition=all'));
    expect(
      calls.some(c => c.method === 'eq' && c.args[0] === 'publication_status' && c.args[1] === 'published'),
    ).toBe(true);
  });
});

describe('only pending review-queue rows reach a public calendar', () => {
  it('month and day both constrain review_status', async () => {
    // The routes fetched every queue state while the formatter emitted
    // reviewStatus 'in_review' unconditionally, so an approved or rejected item
    // kept showing users a settled decision as an open question.
    await monthGET(request('http://t/api/calendar/month?year=2026&month=9&tradition=all'));
    const q = calls.filter(
      c => c.table === 'observance_review_queue' && c.method === 'eq' && c.args[0] === 'review_status',
    );
    expect(q).toHaveLength(1);
    expect(q[0].args[1]).toBe('pending_review');

    calls = [];
    await dayGET(request('http://t/api/calendar/day?date=2026-09-04&tradition=all'));
    expect(
      calls.some(c => c.table === 'observance_review_queue' && c.method === 'eq' && c.args[1] === 'pending_review'),
    ).toBe(true);
  });
});

describe('profile-qualified read contract reaches every public calendar route', () => {
  const assertContract = () => {
    const select = occurrenceSelect();

    // `year` and `series_instance_key` preserve materialiser-owned instance
    // identity. The joined batch proves completeness before a profile-qualified
    // set is allowed to replace the legacy fallback.
    expect(select).toMatch(/\byear\b/);
    expect(select).toContain('series_instance_key');
    expect(select).toContain('batch_id');
    // The internal batch table is service-role only, so it must not be embedded
    // in the caller-scoped query. `attachMaterialisationBatches` hydrates it on
    // the server after RLS has filtered these occurrence rows.
    expect(select).not.toContain('observance_materialisation_batches');
  };

  it('month fetches stable identity and completeness metadata', async () => {
    await monthGET(request('http://t/api/calendar/month?year=2026&month=9&tradition=all'));
    assertContract();
  });

  it('day fetches stable identity and completeness metadata', async () => {
    await dayGET(request('http://t/api/calendar/day?date=2026-09-04&tradition=all'));
    assertContract();
  });

  it('upcoming fetches stable identity and completeness metadata', async () => {
    await upcomingGET(request('http://t/api/calendar/upcoming?days=14&tradition=all'));
    assertContract();
  });

  it('all three routes hydrate server-only completeness metadata', async () => {
    await monthGET(request('http://t/api/calendar/month?year=2026&month=9&tradition=all'));
    await dayGET(request('http://t/api/calendar/day?date=2026-09-04&tradition=all'));
    await upcomingGET(request('http://t/api/calendar/upcoming?days=14&tradition=all'));
    expect(attachBatchesMock).toHaveBeenCalledTimes(3);
  });

  it('all three routes pass the resolved profile to all-absent batch detection', async () => {
    await monthGET(request('http://t/api/calendar/month?year=2026&month=9&tradition=all&calendar_profile=north_indian_purnimanta'));
    await dayGET(request('http://t/api/calendar/day?date=2026-09-04&tradition=all&calendar_profile=north_indian_purnimanta'));
    await upcomingGET(request('http://t/api/calendar/upcoming?days=14&tradition=all&calendar_profile=north_indian_purnimanta'));

    expect(attachBatchesMock).toHaveBeenCalledTimes(3);
    for (const call of attachBatchesMock.mock.calls) {
      expect(call[2]).toBe('north_indian_purnimanta');
      expect(call[3]).toMatchObject({
        latitude: 23.1765,
        longitude: 75.7885,
        timezone: 'Asia/Kolkata',
      });
    }
  });
});
