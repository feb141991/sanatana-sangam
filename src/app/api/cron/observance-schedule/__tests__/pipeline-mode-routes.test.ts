import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

process.env.CRON_SECRET = 'test-secret';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

// Mock Supabase
const mockProfiles = [
  {
    id: 'user-1',
    tradition: 'hindu',
    calendar_profile: null,
    sampradaya: null,
    gender_context: 'female',
    timezone: 'Asia/Kolkata',
    wants_festival_reminders: true,
    wants_vrat_reminders: true,
    wants_tithi_reminders: true,
    observance_reminder_lead_days: [1],
    observance_reminder_time: '08:00',
    notification_quiet_hours_start: null,
    notification_quiet_hours_end: null,
    is_deleting: false,
  },
];

const mockOccurrences = [
  {
    id: 'occ-1',
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    review_status: 'reviewed',
    verification_status: 'verified',
    audit_status: 'completed',
    final_date_source: 'calculated',
    publication_status: 'published',
    observance_definitions: {
      id: 'def-1',
      name: 'Diwali',
      slug: 'diwali',
      kind: 'major',
      active: true,
      emoji: '🪔',
    },
  },
];

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              neq: () => ({
                eq: () => ({
                  order: async () => ({ data: mockOccurrences, error: null }),
                }),
              }),
            }),
          }),
        }),
        or: async () => ({ data: mockProfiles, error: null }),
      }),
      upsert: () => ({
        select: async () => ({ data: [], error: null }),
      }),
    }),
  }),
}));

vi.mock('@/lib/calendar/observance-series-eligibility', () => ({
  fetchIncompleteSeriesOccurrenceIds: async () => new Set(),
}));
const { GET: getFestival } = await import('../../festival-reminder/route');
const { GET: getVrat } = await import('../../vrat-reminder/route');
const { GET: getTithi } = await import('../../tithi-reminder/route');
const { GET: getObservanceSchedule } = await import('../route');

function makeRequest(path: string) {
  return new Request(`https://example.com${path}`, {
    headers: { authorization: 'Bearer test-secret' },
  });
}

describe('observance pipeline mode route guards', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.OBSERVANCE_PIPELINE_MODE;
    delete process.env.OBSERVANCE_PIPELINE_MODE_FESTIVAL;
    delete process.env.OBSERVANCE_PIPELINE_MODE_VRAT;
    delete process.env.OBSERVANCE_PIPELINE_MODE_TITHI;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('festival-reminder aborts with sent: 0 when mode is schedule', async () => {
    process.env.OBSERVANCE_PIPELINE_MODE_FESTIVAL = 'schedule';
    const res = await getFestival(makeRequest('/api/cron/festival-reminder'));
    const body = await res.json();

    expect(body.sent).toBe(0);
    expect(body.pipelineMode).toBe('schedule');
    expect(body.message).toContain('handled by scheduled dispatcher');
  });

  it('festival-reminder aborts when mode is disabled', async () => {
    process.env.OBSERVANCE_PIPELINE_MODE_FESTIVAL = 'disabled';
    const res = await getFestival(makeRequest('/api/cron/festival-reminder'));
    const body = await res.json();

    expect(body.sent).toBe(0);
    expect(body.pipelineMode).toBe('disabled');
    expect(body.message).toContain('disabled');
  });

  it('vrat-reminder aborts with sent: 0 when mode is schedule', async () => {
    process.env.OBSERVANCE_PIPELINE_MODE_VRAT = 'schedule';
    const res = await getVrat(makeRequest('/api/cron/vrat-reminder'));
    const body = await res.json();

    expect(body.sent).toBe(0);
    expect(body.pipelineMode).toBe('schedule');
    expect(body.message).toContain('handled by scheduled dispatcher');
  });

  it('tithi-reminder aborts with sent: 0 when mode is schedule', async () => {
    process.env.OBSERVANCE_PIPELINE_MODE_TITHI = 'schedule';
    const res = await getTithi(makeRequest('/api/cron/tithi-reminder'));
    const body = await res.json();

    expect(body.sent).toBe(0);
    expect(body.pipelineMode).toBe('schedule');
    expect(body.message).toContain('handled by scheduled dispatcher');
  });

  it('observance-schedule refuses live mutations when pipeline mode is legacy', async () => {
    // Both default to legacy
    const res = await getObservanceSchedule(makeRequest('/api/cron/observance-schedule'));
    const body = await res.json();

    expect(body.scheduledCount).toBe(0);
    expect(body.message).toContain("no observance categories are in 'schedule' mode");
    expect(body.pipelineModes.festival).toBe('legacy');
    expect(body.pipelineModes.vrat).toBe('legacy');
  });

  it('observance-schedule allows dry-run preview even when pipeline mode is legacy', async () => {
    const res = await getObservanceSchedule(makeRequest('/api/cron/observance-schedule?preview=true'));
    const body = await res.json();

    expect(body.preview).toBe(true);
    expect(body.pipelineModes.festival).toBe('legacy');
    expect(body.totalCandidates).toBeDefined();
  });
});
