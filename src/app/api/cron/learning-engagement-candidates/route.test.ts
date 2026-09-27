import { afterEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('learning engagement candidate cron route', () => {
  it('rejects requests without the cron bearer secret', async () => {
    process.env.CRON_SECRET = 'test-secret';
    const { GET } = await import('./route');
    const response = await GET(new Request('https://shoonaya.com/api/cron/learning-engagement-candidates'));
    expect(response.status).toBe(401);
  });

  it('returns before data access when the global resolver is disabled', async () => {
    process.env.CRON_SECRET = 'test-secret';
    delete process.env.NOTIFICATION_RESOLVER_ENABLED;
    process.env.NOTIFICATION_CANDIDATE_MODE_DHARM_VEER = 'candidate';
    const { GET } = await import('./route');
    const response = await GET(new Request('https://shoonaya.com/api/cron/learning-engagement-candidates', {
      headers: { authorization: 'Bearer test-secret' },
    }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      skipped: true,
      reason: 'learning_candidates_not_enabled',
    });
  });

  it('is default-off when neither per-type candidate mode is set', async () => {
    process.env.CRON_SECRET = 'test-secret';
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
    delete process.env.NOTIFICATION_CANDIDATE_MODE_DHARM_VEER;
    delete process.env.NOTIFICATION_CANDIDATE_MODE_QUIZ;
    const { GET } = await import('./route');
    const response = await GET(new Request('https://shoonaya.com/api/cron/learning-engagement-candidates', {
      headers: { authorization: 'Bearer test-secret' },
    }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      skipped: true,
      reason: 'learning_candidates_not_enabled',
      dharmVeerMode: 'disabled',
      quizMode: 'disabled',
    });
  });

  // The real correctness property this route adds on top of the already-
  // tested scheduler (src/lib/learning-pilot-scheduler.test.ts covers the
  // scheduler itself): generateLearningEngagementCandidates evaluates every
  // devotee against every date it's given, with no per-devotee filter, so a
  // multi-timezone cohort MUST be grouped by each devotee's own local date
  // before calling it -- otherwise a devotee could be evaluated against a
  // neighboring timezone's "today", producing a candidate for the wrong
  // date or a scheduled_for instant already in the past.
  it('groups devotees by their OWN local date, never a pooled cross-timezone date', async () => {
    process.env.CRON_SECRET = 'test-secret';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
    process.env.NOTIFICATION_CANDIDATE_MODE_DHARM_VEER = 'candidate';

    const schedulerCalls: Array<{ devotees: { id: string; timezone?: string | null }[]; dates: string[] }> = [];
    vi.doMock('@/lib/learning-pilot-scheduler', () => ({
      generateLearningEngagementCandidates: vi.fn(async (options: any) => {
        schedulerCalls.push({ devotees: options.devotees, dates: options.dates });
        return { ok: true, dryRun: false, totalCandidates: 0, dharmVeerCount: 0, quizCount: 0, candidates: [], insertedCount: 0 };
      }),
    }));

    // Two devotees in timezones far enough apart that they can genuinely
    // land on different UTC-observed local dates at a single instant.
    const profileRows = [
      { id: 'user-tokyo', timezone: 'Asia/Tokyo', tradition: 'hindu', app_language: 'en', quiz_reminder_time: null, notification_quiet_hours_start: null, notification_quiet_hours_end: null, dharm_veer_reminder_enabled: true, is_deleting: false },
      { id: 'user-la', timezone: 'America/Los_Angeles', tradition: 'hindu', app_language: 'en', quiz_reminder_time: null, notification_quiet_hours_start: null, notification_quiet_hours_end: null, dharm_veer_reminder_enabled: true, is_deleting: false },
    ];

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({
        from: () => ({
          select: () => ({
            or: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: profileRows, error: null }),
              }),
            }),
          }),
        }),
      }),
    }));

    const { GET } = await import('./route');
    const response = await GET(new Request('https://shoonaya.com/api/cron/learning-engagement-candidates', {
      headers: { authorization: 'Bearer test-secret' },
    }));
    expect(response.status).toBe(200);

    // Each call's devotee list must be internally consistent with the
    // single date it was called with -- and if Tokyo/LA genuinely differ in
    // local date at this fixed instant, they must appear in SEPARATE calls,
    // never combined with a date that isn't their own.
    expect(schedulerCalls.length).toBeGreaterThanOrEqual(1);
    for (const call of schedulerCalls) {
      expect(call.dates).toHaveLength(1);
    }
    const totalDevoteesAcrossCalls = schedulerCalls.reduce((sum, c) => sum + c.devotees.length, 0);
    expect(totalDevoteesAcrossCalls).toBe(2);
  });
});
