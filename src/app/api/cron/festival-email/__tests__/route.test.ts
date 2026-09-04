/**
 * This route was the only calendar-facing read path querying
 * observance_occurrences with no withheld-filtering at all -- unlike every
 * screen (home-summary, calendar/month, /upcoming, /day, /export), which
 * applies filterWithheldJoinedRows or formatOccurrencesToResults internally.
 * An unfiltered read here is worse than an unfiltered screen: this route
 * PUSHES an email, which can't be un-sent. Found during the 2026-09-04
 * catalogue audit, which confirmed 48 currently-deferred definitions (plus 7
 * manual-seed slugs with no rule at all) all have live `published`
 * observance_occurrences rows this query would otherwise read unfiltered.
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
        return { select: () => ({ eq: () => ({ limit: async () => ({ data: occurrenceRows, error: null }) }) }) };
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

beforeEach(() => {
  sendShoonayaEmail.mockClear();
  occurrenceRows = [];
});

describe('GET /api/cron/festival-email — withheld filtering', () => {
  it('does not email users about a launch_status: deferred festival with a stray published row', async () => {
    // Onam is a real, currently-deferred rule (rules.json) that -- per the
    // 2026-09-04 audit -- already has a `published` occurrence row. This
    // reproduces that exact shape: the row exists, is published, but must
    // never be pushed to a user.
    occurrenceRows = [
      {
        date: '2099-01-01',
        observance_definitions: { slug: 'onam', name: 'Onam' },
      },
    ];

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.sent).toBe(0);
    expect(sendShoonayaEmail).not.toHaveBeenCalled();
  });

  it('still emails users about a real, publishable festival', async () => {
    occurrenceRows = [
      {
        date: '2099-01-01',
        observance_definitions: { slug: 'diwali', name: 'Diwali' },
      },
    ];

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(sendShoonayaEmail).toHaveBeenCalledTimes(1);
    expect(body.sent).toBe(1);
  });
});
