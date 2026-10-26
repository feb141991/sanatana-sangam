import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../route';
import { sendPushNotification } from '@/lib/push-server';

const mocks = vi.hoisted(() => ({
  claimedRows: [] as Array<Record<string, unknown>>,
  profiles: [] as Array<Record<string, unknown>>,
  profileError: null as { message: string; code?: string } | null,
  // Per-call profile errors, consumed in order before falling back to profileError.
  profileErrorQueue: [] as Array<{ message: string; code?: string } | null>,
  profileSelects: [] as string[],
  sadhanaResponse: { data: null, error: null } as { data: unknown[] | null; error: { message: string } | null },
  sadhanaDates: [] as string[],
  quizResponse: { data: null, error: null } as { data: unknown[] | null; error: { message: string } | null },
  quizDates: [] as string[],
  updates: [] as Array<{ table: string; update: unknown; ids?: string[] }>,
}));

vi.mock('@/lib/push-server', () => ({
  sendPushNotification: vi.fn().mockResolvedValue({ sentUserIds: [], skippedUserIds: [] }),
}));
vi.mock('@/lib/notification-dispatch-audit', () => ({ recordNotificationDispatchBatch: vi.fn() }));
vi.mock('@/lib/monitoring/events', () => ({ emitEvent: vi.fn(), emitError: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: vi.fn().mockImplementation(async () => ({ data: mocks.claimedRows, error: null })),
    from: (table: string) => {
      const response = () => {
        const profileError = table === 'profiles' && mocks.profileErrorQueue.length > 0
          ? mocks.profileErrorQueue.shift() ?? null
          : mocks.profileError;
        return {
          data: table === 'profiles' ? (profileError ? null : mocks.profiles) : table === 'quiz_responses' ? mocks.quizResponse.data : mocks.sadhanaResponse.data,
          error: table === 'profiles' ? profileError : table === 'daily_sadhana' ? mocks.sadhanaResponse.error : table === 'quiz_responses' ? mocks.quizResponse.error : null,
        };
      };
      return {
        select: vi.fn().mockImplementation((columns: string) => {
          if (table === 'profiles') mocks.profileSelects.push(columns);
          return {
          in: vi.fn().mockImplementation(() => table === 'profiles'
            ? Promise.resolve(response())
            : { eq: vi.fn().mockImplementation(async (_column: string, date: string) => {
                if (table === 'quiz_responses') mocks.quizDates.push(date);
                else mocks.sadhanaDates.push(date);
                return response();
              }) }),
          };
        }),
        update: vi.fn().mockImplementation((update: unknown) => ({
          in: vi.fn().mockImplementation((_column: string, ids: string[]) => {
            mocks.updates.push({ table, update, ids });
            const result = { error: null };
            return {
              eq: vi.fn().mockResolvedValue(result),
              then: (resolve: (value: typeof result) => unknown) => resolve(result),
            };
          }),
        })),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      };
    },
  }),
}));

describe('GET /api/cron/notification-dispatch Japa completion guard', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-29T12:30:00.000Z'));
    process.env = {
      ...originalEnv,
      CRON_SECRET: 'dispatch-secret',
      INTERNAL_DISPATCH_SECRET: '',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
    };
    mocks.claimedRows = [{
      id: 'schedule-1',
      user_id: 'user-1',
      notification_type: 'japa',
      notification_key: 'japa:2026-09-29',
      title: 'Japa reminder',
      body: 'Practice time',
      metadata: { local_date: '2026-09-29', timezone: 'Europe/London' },
      retry_count: 0,
    }];
    mocks.profiles = [{
      id: 'user-1',
      timezone: 'Europe/London',
      notification_quiet_hours_start: null,
      notification_quiet_hours_end: null,
      is_deleting: false,
      wants_family_notifications: true,
      wants_festival_reminders: true,
      wants_vrat_reminders: true,
      wants_tithi_reminders: true,
      wants_sankalpa_midpoint_reminders: true,
      japa_reminder_enabled: true,
      wants_shloka_reminders: true,
      last_shloka_date: '2026-09-28',
    }];
    mocks.sadhanaResponse = { data: [{ user_id: 'user-1', japa_done: true }], error: null };
    mocks.quizResponse = { data: [], error: null };
    mocks.profileError = null;
    mocks.profileErrorQueue = [];
    mocks.profileSelects = [];
    mocks.sadhanaDates = [];
    mocks.quizDates = [];
    mocks.updates = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.useRealTimers();
  });

  const request = () => new Request('https://shoonaya.com/api/cron/notification-dispatch', {
    headers: { authorization: 'Bearer dispatch-secret' },
  });

  it('skips a Japa reminder completed before delivery', async () => {
    // London 03:00 is still part of the previous spiritual date (04:00 boundary).
    mocks.claimedRows[0].send_at = '2026-09-29T02:30:00.000Z';
    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ claimed: 1, succeeded: 0, skipped: 1 });
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(mocks.sadhanaDates).toContain('2026-09-28');
    expect(mocks.updates).toContainEqual({
      table: 'notification_schedule',
      update: { status: 'skipped', error: 'japa_completed_before_delivery' },
      ids: ['schedule-1'],
    });
  });

  it('requeues the claimed batch and returns retryable failure when completion is unknown', async () => {
    mocks.sadhanaResponse = { data: null, error: { message: 'database unavailable' } };

    const response = await GET(request());

    expect(response.status).toBe(503);
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(mocks.updates).toContainEqual({
      table: 'notification_schedule',
      update: { status: 'pending', claimed_at: null, error: 'japa_completion_lookup_retry' },
      ids: ['schedule-1'],
    });
  });

  it('requeues the claimed batch when profile eligibility cannot be verified', async () => {
    mocks.profileError = { message: 'database unavailable', code: '57P01' };

    const response = await GET(request());

    expect(response.status).toBe(503);
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(mocks.updates).toContainEqual({
      table: 'notification_schedule',
      update: { status: 'pending', claimed_at: null, error: 'profile_lookup_retry' },
      ids: ['schedule-1'],
    });
  });

  it('skips an already-scheduled Japa reminder after the user disables it', async () => {
    mocks.profiles[0].japa_reminder_enabled = false;
    mocks.sadhanaResponse = { data: [], error: null };

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ claimed: 1, succeeded: 0, skipped: 1 });
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(mocks.updates).toContainEqual({
      table: 'notification_schedule',
      update: { status: 'skipped', error: 'japa_reminders_disabled' },
      ids: ['schedule-1'],
    });
  });

  it('skips a Shloka reminder when the user has read that date after scheduling', async () => {
    mocks.claimedRows[0] = {
      id: 'schedule-shloka-1',
      user_id: 'user-1',
      notification_type: 'shloka',
      notification_key: 'candidate:shloka:2026-09-29',
      title: 'Shloka reminder',
      body: 'Read today’s verse',
      send_at: '2026-09-29T18:00:00.000Z',
      metadata: { local_date: '2026-09-29', timezone: 'Europe/London' },
      retry_count: 0,
    };
    mocks.profiles[0].last_shloka_date = '2026-09-29';

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ claimed: 1, succeeded: 0, skipped: 1 });
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(mocks.updates).toContainEqual({
      table: 'notification_schedule',
      update: { status: 'skipped', error: 'shloka_completed_before_delivery' },
      ids: ['schedule-shloka-1'],
    });
  });

  it('skips a queued Shloka reminder after the user disables it', async () => {
    mocks.claimedRows[0] = {
      id: 'schedule-shloka-2',
      user_id: 'user-1',
      notification_type: 'shloka',
      notification_key: 'candidate:shloka:2026-09-29',
      title: 'Shloka reminder',
      body: 'Read today’s verse',
      send_at: '2026-09-29T18:00:00.000Z',
      metadata: { local_date: '2026-09-29', timezone: 'Europe/London' },
      retry_count: 0,
    };
    mocks.profiles[0].wants_shloka_reminders = false;

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ claimed: 1, succeeded: 0, skipped: 1 });
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(mocks.updates).toContainEqual({
      table: 'notification_schedule',
      update: { status: 'skipped', error: 'shloka_reminders_disabled' },
      ids: ['schedule-shloka-2'],
    });
  });

  it('skips an opted-in quiz reminder when the quiz was completed after scheduling', async () => {
    mocks.claimedRows[0] = {
      id: 'schedule-quiz-1',
      user_id: 'user-1',
      notification_type: 'quiz',
      notification_key: 'quiz:daily-2026-09-29:available:2026-09-29:en',
      title: 'Today’s Daily Quiz is ready',
      body: 'Take a moment to explore today’s question.',
      send_at: '2026-09-29T07:00:00.000Z',
      metadata: { local_date: '2026-09-29', timezone: 'Europe/London', action_url: '/quiz' },
      retry_count: 0,
    };
    mocks.profiles[0].quiz_reminder_enabled = true;
    mocks.quizResponse = { data: [{ user_id: 'user-1' }], error: null };

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ claimed: 1, succeeded: 0, skipped: 1 });
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(mocks.quizDates).toContain('2026-09-29');
    expect(mocks.updates).toContainEqual({
      table: 'notification_schedule',
      update: { status: 'skipped', error: 'quiz_completed_before_delivery' },
      ids: ['schedule-quiz-1'],
    });
  });

  it('requeues rather than sending when quiz completion cannot be checked', async () => {
    mocks.claimedRows[0] = {
      id: 'schedule-quiz-2',
      user_id: 'user-1',
      notification_type: 'quiz',
      notification_key: 'quiz:daily-2026-09-29:evening_nudge:2026-09-29:en',
      title: 'A gentle quiz reminder',
      body: 'There is still time to try today’s quiz.',
      send_at: '2026-09-29T18:00:00.000Z',
      metadata: { local_date: '2026-09-29', timezone: 'Europe/London', action_url: '/quiz' },
      retry_count: 0,
    };
    mocks.profiles[0].quiz_reminder_enabled = true;
    mocks.quizResponse = { data: null, error: { message: 'database unavailable' } };

    const response = await GET(request());

    expect(response.status).toBe(503);
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(mocks.updates).toContainEqual({
      table: 'notification_schedule',
      update: { status: 'pending', claimed_at: null, error: 'quiz_completion_lookup_retry' },
      ids: ['schedule-quiz-2'],
    });
  });
  describe('night delivery', () => {
    // 23:30 in London (BST) on 2026-09-29.
    const nightUtc = '2026-09-29T22:30:00.000Z';

    beforeEach(() => {
      vi.setSystemTime(new Date(nightUtc));
    });

    it('skips an app-timed reminder at night when the user set no quiet hours', async () => {
      mocks.claimedRows[0] = {
        id: 'schedule-mood-night',
        user_id: 'user-1',
        notification_type: 'mood',
        notification_key: 'mood-evening:user-1:2026-09-29',
        title: 'Evening check-in',
        body: 'How was today?',
        send_at: nightUtc,
        metadata: { local_date: '2026-09-29', timezone: 'Europe/London' },
        retry_count: 0,
      };

      const response = await GET(request());

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ claimed: 1, succeeded: 0, skipped: 1 });
      expect(sendPushNotification).not.toHaveBeenCalled();
      expect(mocks.updates).toContainEqual({
        table: 'notification_schedule',
        update: { status: 'skipped', error: 'default_quiet_hours' },
        ids: ['schedule-mood-night'],
      });
    });

    it('still sends a Japa reminder at the night-time the user picked', async () => {
      mocks.claimedRows[0].send_at = nightUtc;
      mocks.sadhanaResponse = { data: [], error: null };

      const response = await GET(request());

      expect(response.status).toBe(200);
      expect(sendPushNotification).toHaveBeenCalledTimes(1);
      expect(mocks.updates.some((entry) => (entry.update as { error?: string }).error === 'default_quiet_hours')).toBe(false);
    });

    it('applies the quiet window the user set, even to a picked Japa time', async () => {
      mocks.claimedRows[0].send_at = nightUtc;
      mocks.sadhanaResponse = { data: [], error: null };
      mocks.profiles[0].notification_quiet_hours_start = 23;
      mocks.profiles[0].notification_quiet_hours_end = 7;

      const response = await GET(request());

      expect(response.status).toBe(200);
      expect(sendPushNotification).not.toHaveBeenCalled();
      expect(mocks.updates).toContainEqual({
        table: 'notification_schedule',
        update: { status: 'skipped', error: 'quiet_hours_active' },
        ids: ['schedule-1'],
      });
    });
  });

  describe('Brahma Muhurta opt-in', () => {
    const brahmaRow = () => ({
      id: 'schedule-brahma-1',
      user_id: 'user-1',
      notification_type: 'brahma_muhurta',
      notification_key: 'brahma_muhurta:user-1:2026-09-30',
      title: 'Brahma Muhurta',
      body: 'The sacred hour opens',
      send_at: '2026-09-30T03:40:00.000Z',
      metadata: { local_date: '2026-09-30', timezone: 'Europe/London' },
      retry_count: 0,
    });

    beforeEach(() => {
      // 04:40 in London, inside the default night window.
      vi.setSystemTime(new Date('2026-09-30T03:40:00.000Z'));
      mocks.claimedRows[0] = brahmaRow();
    });

    it('skips a queued Brahma Muhurta push for a user who opted out', async () => {
      mocks.profiles[0].wants_brahma_muhurta_reminders = false;
      const response = await GET(request());

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ claimed: 1, succeeded: 0, skipped: 1 });
      expect(sendPushNotification).not.toHaveBeenCalled();
      expect(mocks.updates).toContainEqual({
        table: 'notification_schedule',
        update: { status: 'skipped', error: 'brahma_muhurta_reminders_disabled' },
        ids: ['schedule-brahma-1'],
      });
      expect(mocks.profileSelects[0]).toContain('wants_brahma_muhurta_reminders');
    });

    it('sends pre-dawn to an opted-in user despite the default night window', async () => {
      mocks.profiles[0].wants_brahma_muhurta_reminders = true;

      const response = await GET(request());

      expect(response.status).toBe(200);
      expect(sendPushNotification).toHaveBeenCalledTimes(1);
    });

    it('re-reads without the opt-in column before it is migrated and fails closed', async () => {
      mocks.profiles[0].wants_brahma_muhurta_reminders = undefined;
      mocks.profileErrorQueue = [{ message: 'column does not exist', code: '42703' }];

      const response = await GET(request());

      expect(response.status).toBe(200);
      expect(mocks.profileSelects).toHaveLength(2);
      expect(mocks.profileSelects[1]).not.toContain('wants_brahma_muhurta_reminders');
      expect(mocks.profileSelects[1]).toContain('wants_family_remembrance_reminders');
      expect(sendPushNotification).not.toHaveBeenCalled();
      expect(mocks.updates).toContainEqual({
        table: 'notification_schedule',
        update: { status: 'skipped', error: 'brahma_muhurta_reminders_disabled' },
        ids: ['schedule-brahma-1'],
      });
    });
  });
});
