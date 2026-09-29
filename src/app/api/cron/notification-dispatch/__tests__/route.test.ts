import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../route';
import { sendPushNotification } from '@/lib/push-server';

const mocks = vi.hoisted(() => ({
  claimedRows: [] as Array<Record<string, unknown>>,
  profiles: [] as Array<Record<string, unknown>>,
  sadhanaResponse: { data: null, error: null } as { data: unknown[] | null; error: { message: string } | null },
  sadhanaDates: [] as string[],
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
      const response = () => ({
        data: table === 'profiles' ? mocks.profiles : mocks.sadhanaResponse.data,
        error: table === 'daily_sadhana' ? mocks.sadhanaResponse.error : null,
      });
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockImplementation(() => table === 'profiles'
            ? Promise.resolve(response())
            : { eq: vi.fn().mockImplementation(async (_column: string, date: string) => {
                mocks.sadhanaDates.push(date);
                return response();
              }) }),
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
    }];
    mocks.sadhanaResponse = { data: [{ user_id: 'user-1', japa_done: true }], error: null };
    mocks.sadhanaDates = [];
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
});
