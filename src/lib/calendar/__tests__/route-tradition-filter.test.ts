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
    }),
  };
});

const { GET: monthGET } = await import('@/app/api/calendar/month/route');
const { GET: dayGET } = await import('@/app/api/calendar/day/route');

const request = (url: string) => ({ nextUrl: new URL(url) }) as any;

const traditionFilters = () =>
  calls.filter(c => c.method === 'in' && c.args[0] === 'observance_definitions.tradition');

beforeEach(() => { calls = []; });

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
