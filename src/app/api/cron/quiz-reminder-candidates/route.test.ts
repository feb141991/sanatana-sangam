import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const mocks = vi.hoisted(() => ({
  profiles: [] as Array<Record<string, unknown>>,
  profileError: null as { message: string } | null,
  quizRows: [] as Array<{ user_id: string }>,
  quizError: null as { message: string } | null,
  upserts: [] as Array<{ rows: unknown; options: unknown }>,
  fromCalls: [] as string[],
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      mocks.fromCalls.push(table);
      if (table === 'notification_candidates') {
        return {
          upsert: (rows: unknown, options: unknown) => {
            mocks.upserts.push({ rows, options });
            return { select: async () => ({ data: Array.isArray(rows) ? rows.map((_, index) => ({ id: `candidate-${index}` })) : [], error: null }) };
          },
        };
      }

      const query: Record<string, unknown> = {};
      for (const method of ['select', 'eq', 'or', 'order', 'limit', 'gt', 'in']) {
        query[method] = vi.fn(() => query);
      }
      query.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
        const result = table === 'profiles'
          ? { data: mocks.profiles, error: mocks.profileError }
          : { data: mocks.quizRows, error: mocks.quizError };
        return Promise.resolve(result).then(resolve, reject);
      };
      return query;
    },
  }),
}));

describe('GET /api/cron/quiz-reminder-candidates', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-08T02:35:00.000Z'));
    process.env = {
      ...originalEnv,
      CRON_SECRET: 'cron-secret',
      INTERNAL_DISPATCH_SECRET: '',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role',
      NOTIFICATION_RESOLVER_ENABLED: 'true',
      NOTIFICATION_CANDIDATE_MODE_QUIZ: 'candidate',
    };
    mocks.profiles = [{
      id: 'quiz-user',
      timezone: 'Asia/Kolkata',
      tradition: 'hindu',
      app_language: 'en',
      quiz_reminder_enabled: true,
      quiz_reminder_time: '08:00',
      is_deleting: false,
    }];
    mocks.profileError = null;
    mocks.quizRows = [];
    mocks.quizError = null;
    mocks.upserts = [];
    mocks.fromCalls = [];
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.useRealTimers();
  });

  const request = (authorization = 'Bearer cron-secret') => new Request(
    'https://shoonaya.com/api/cron/quiz-reminder-candidates',
    { headers: { authorization } },
  );

  it('rejects unauthorized requests before accessing the database', async () => {
    const response = await GET(request(''));
    expect(response.status).toBe(401);
    expect(mocks.fromCalls).toEqual([]);
  });

  it('creates the ready notification only for opted-in users who have not completed today', async () => {
    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ availabilityCandidates: 1, eveningCandidates: 0, candidatesInserted: 1 });
    expect(mocks.upserts).toHaveLength(1);
    expect(mocks.upserts[0].options).toMatchObject({
      onConflict: 'user_id,event_type,event_id,event_instance,local_date,audience_variant',
      ignoreDuplicates: true,
    });
    expect(mocks.upserts[0].rows).toMatchObject([{
      user_id: 'quiz-user',
      event_type: 'quiz',
      event_instance: 'available',
      local_date: '2026-11-08',
      scheduled_for: '2026-11-08T02:30:00.000Z',
    }]);
  });

  it('does not recreate a reminder after today’s quiz is completed', async () => {
    mocks.quizRows = [{ user_id: 'quiz-user' }];
    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ completedUsersExcluded: 1, candidatesInserted: 0 });
    expect(mocks.upserts).toEqual([]);
  });

  it('fails closed if completion state cannot be read', async () => {
    mocks.quizError = { message: 'database unavailable' };
    const response = await GET(request());

    expect(response.status).toBe(503);
    expect(mocks.upserts).toEqual([]);
  });

  it('does not query profiles while either pipeline gate is off', async () => {
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'false';
    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ skipped: true, reason: 'quiz_candidate_pipeline_not_enabled' });
    expect(mocks.fromCalls).toEqual([]);
  });
});
