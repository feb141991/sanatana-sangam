/**
 * This route was the only calendar-facing read path querying
 * observance_occurrences with no withheld-filtering at all -- unlike every
 * screen (home-summary, calendar/month, /upcoming, /day, /export), which
 * applies filterWithheldJoinedRows or formatOccurrencesToResults internally.
 * An unfiltered read here is worse than an unfiltered screen: this route
 * PUSHES an email, which can't be un-sent.
 *
 * Two rounds of review found three distinct gaps, all covered below:
 * 1. filterWithheldJoinedRows returns `false` (not withheld) for a slug with
 *    ZERO rules.json rows (withheld.ts:87) -- it has nothing to check. A
 *    first fix here added the filter but claimed, incorrectly, that it also
 *    covered the 7 manual-seed slugs (das-lakshana-dharma, gudi-padwa-ugadi,
 *    paryushana-parva, pavarana, samvatsari, sangha-day, vassa-begins) that
 *    have no rule at all. It did not -- the route now also fails closed on
 *    any slug absent from CANONICAL_RULES.
 * 2. The query itself never restricted to publication_status: 'published',
 *    so a 'draft' or 'withheld_disputed' row whose slug still has a
 *    currently-publishable rule could reach filterWithheldJoinedRows and
 *    pass, since that function checks the RULE, never the row's own
 *    publication_status (outside one narrow bypass this route's rows never
 *    qualify for).
 * 3. Email content read def.name/def.theme, neither of which has ever
 *    existed as an observance_definitions column (only display_name does) --
 *    every subject silently fell back to a generic "Festival is in 3 days."
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendShoonayaEmail = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/email', () => ({ sendShoonayaEmail: (...a: unknown[]) => sendShoonayaEmail(...a) }));

let occurrenceRows: any[] = [];
const profileRows = [
  { id: 'u1', email: 'user@example.com', full_name: 'Test User', tradition: 'hindu', unsubscribe_token: 'tok' },
];

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'observance_occurrences') {
        // Generic .eq() chain: each call filters the current working set by
        // whatever column/value it's given, so the test can prove
        // publication_status is actually enforced at the query level, not
        // just downstream.
        const builder = (rows: any[]) => ({
          eq: (col: string, val: unknown) => builder(rows.filter(r => r[col] === val)),
          order: async (_col: string) => ({ data: rows, error: null }),
        });
        return { select: () => builder(occurrenceRows) };
      }
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({ not: () => ({ not: async () => ({ data: profileRows, error: null }) }) }),
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

process.env.CRON_SECRET = 'test-secret';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

const { GET } = await import('../route');

function makeRequest() {
  return new Request('https://example.com/api/cron/festival-email', {
    headers: { authorization: 'Bearer test-secret' },
  });
}

// The route computes its own target date as "today + 3 days" at call time
// (there is no way to inject a fixed date), so every test row must match
// that same computation -- a hardcoded far-future date would never match
// and every test would pass for the wrong reason (zero rows from the date
// filter, not from the behavior under test).
function targetDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().slice(0, 10);
}

/** Every field the query/filters touch, defaulted to the "should send" case. */
function row(overrides: Partial<{ date: string; publication_status: string; slug: string; display_name: string }> = {}) {
  return {
    date: overrides.date ?? targetDate(),
    publication_status: overrides.publication_status ?? 'published',
    observance_definitions: {
      slug: overrides.slug ?? 'diwali',
      display_name: overrides.display_name ?? 'Diwali',
    },
  };
}

beforeEach(() => {
  sendShoonayaEmail.mockClear();
  occurrenceRows = [];
});

describe('GET /api/cron/festival-email — withheld filtering', () => {
  it('does not email users about a launch_status: deferred festival with a stray published row', async () => {
    // Onam is a real, currently-deferred rule (rules.json) that -- per the
    // 2026-09-04 audit -- already has a published occurrence row.
    occurrenceRows = [row({ slug: 'onam', display_name: 'Onam' })];

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.sent).toBe(0);
    expect(sendShoonayaEmail).not.toHaveBeenCalled();
  });

  it('does not email users about a manual-seed slug with NO rules.json entry at all', async () => {
    // gudi-padwa-ugadi: a real slug with a live published row (legacy_sync)
    // but zero rules.json rows. filterWithheldJoinedRows alone returns
    // `false` (not withheld) for this shape -- confirmed the gap a first
    // version of this fix missed. Must be blocked by the separate
    // existence check, not the rule-based one.
    occurrenceRows = [row({ slug: 'gudi-padwa-ugadi', display_name: 'Gudi Padwa / Ugadi' })];

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.sent).toBe(0);
    expect(sendShoonayaEmail).not.toHaveBeenCalled();
  });

  it('does not email users about a row that is not publication_status: published', async () => {
    // A 'withheld_disputed' row for a slug whose RULE is otherwise fine
    // (diwali) must still never be emailed -- filterWithheldJoinedRows does
    // not check the row's own publication_status.
    occurrenceRows = [row({ publication_status: 'withheld_disputed' })];

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.sent).toBe(0);
    expect(sendShoonayaEmail).not.toHaveBeenCalled();
  });

  it('still emails users about a real, publishable, published festival', async () => {
    occurrenceRows = [row()];

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(sendShoonayaEmail).toHaveBeenCalledTimes(1);
    expect(body.sent).toBe(1);
  });

  it('a valid 4th festival is not crowded out by 3 withheld ones sharing its date', async () => {
    // The cap on how many festivals one email run covers must apply AFTER
    // policy filtering, not on the raw query -- otherwise up to 3
    // withheld/unruled rows can occupy the entire result set and a real,
    // publishable 4th festival for the same date never gets considered at
    // all. This is the exact shape a naive `.limit(3)` on the raw query
    // would have hidden.
    occurrenceRows = [
      row({ slug: 'gudi-padwa-ugadi', display_name: 'Gudi Padwa / Ugadi' }), // no rule
      row({ slug: 'onam', display_name: 'Onam' }), // deferred rule
      row({ slug: 'samvatsari', display_name: 'Samvatsari' }), // no rule
      row({ slug: 'diwali', display_name: 'Diwali' }), // the valid 4th
    ];

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(sendShoonayaEmail).toHaveBeenCalledTimes(1);
    expect(body.sent).toBe(1);
    expect(sendShoonayaEmail.mock.calls[0][0].subject.toLowerCase()).toContain('diwali');
  });

  it('uses display_name for the email subject instead of the non-existent name/theme fields', async () => {
    occurrenceRows = [row({ slug: 'diwali', display_name: 'Diwali' })];

    await GET(makeRequest());

    expect(sendShoonayaEmail).toHaveBeenCalledTimes(1);
    const call = sendShoonayaEmail.mock.calls[0][0];
    expect(call.subject).not.toContain('undefined');
    expect(call.subject.toLowerCase()).toContain('diwali');
  });
});
