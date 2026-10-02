import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';

// Legacy mode must enqueue into the shared cadence guard, never send directly.
vi.mock('@/lib/push-server', () => ({
  sendPushNotification: vi.fn().mockResolvedValue({ sent: 1, failed: 0 }),
}));

const queueMock = vi.hoisted(() => vi.fn().mockResolvedValue({ queued: 1, ignored: 0 }));
vi.mock('@/lib/notification-schedule-queue', () => ({
  enqueueNotificationSchedule: queueMock,
}));

vi.mock('@/lib/sacred-time', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/sacred-time')>();
  return {
    ...actual,
    getNextLocalHourUtc: vi.fn(() => ({
      sendAt: new Date('2026-11-08T12:30:00.000Z'),
      localDateIso: '2026-11-08',
      localHour: 18,
    })),
  };
});

describe('GET /api/cron/mood-reminder-evening', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    queueMock.mockClear();
    process.env = {
      ...originalEnv,
      CRON_SECRET: 'test-cron-secret',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    };
    queueMock.mockResolvedValue({ queued: 1, ignored: 0 });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('rejects unauthorized requests', async () => {
    const req = new Request('http://localhost/api/cron/mood-reminder-evening', {
      headers: { authorization: 'Bearer wrong-secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('halts with skipped: true when pipeline mode is disabled', async () => {
    process.env.NOTIFICATION_ROUTINE_MODE_MOOD = 'disabled';

    const req = new Request('http://localhost/api/cron/mood-reminder-evening', {
      headers: { authorization: 'Bearer test-cron-secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.skipped).toBe(true);
    expect(body.pipeline_mode).toBe('disabled');
    expect(body.reason).toBe('mood_reminders_disabled_by_policy');
  });

  it('produces candidates into notification_candidates under candidate mode with zero push calls', async () => {
    process.env.NOTIFICATION_ROUTINE_MODE_MOOD = 'candidate';
    const { sendPushNotification } = await import('@/lib/push-server');

    const upsertCandidateMock = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [{ id: 'cand-evening-1' }], error: null }),
    });

    const createClientMock = vi.fn().mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'user-evening-1',
                    full_name: 'Evening Devotee',
                    tradition: 'hindu',
                    timezone: 'Asia/Kolkata',
                    notification_quiet_hours_start: null,
                    notification_quiet_hours_end: null,
                    is_deleting: false,
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        if (table === 'notification_candidates') {
          return { upsert: upsertCandidateMock };
        }
        throw new Error(`Unexpected table access: ${table}`);
      }),
    });

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: createClientMock,
    }));

    const { GET: routeGet } = await import('../route');
    const req = new Request('http://localhost/api/cron/mood-reminder-evening', {
      headers: { authorization: 'Bearer test-cron-secret' },
    });
    const res = await routeGet(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.pipeline_mode).toBe('candidate');
    expect(body.candidates_produced).toBe(1);
    expect(upsertCandidateMock).toHaveBeenCalledTimes(1);
    expect(sendPushNotification).not.toHaveBeenCalled();
  });

  it('queues the local evening slot in legacy mode without direct push or bell writes', async () => {
    process.env.NOTIFICATION_ROUTINE_MODE_MOOD = 'legacy';
    const { sendPushNotification } = await import('@/lib/push-server');

    const createClientMock = vi.fn().mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'user-evening-1',
                    full_name: 'Evening Devotee',
                    tradition: 'hindu',
                    timezone: 'Asia/Kolkata',
                    notification_quiet_hours_start: null,
                    notification_quiet_hours_end: null,
                    is_deleting: false,
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        throw new Error(`Unexpected table access: ${table}`);
      }),
    });

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: createClientMock,
    }));

    const { GET: routeGet } = await import('../route');
    const req = new Request('http://localhost/api/cron/mood-reminder-evening', {
      headers: { authorization: 'Bearer test-cron-secret' },
    });
    const res = await routeGet(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pipeline_mode).toBe('legacy');
    expect(body.enqueued).toBe(1);
    expect(queueMock).toHaveBeenCalledTimes(1);
    expect(queueMock.mock.calls[0][1][0]).toMatchObject({
      notification_type: 'mood',
      send_at: '2026-11-08T12:30:00.000Z',
      notification_key: 'mood-evening:user-evening-1:2026-11-08',
      metadata: { local_date: '2026-11-08', timezone: 'Asia/Kolkata', action_url: '/discover/mood' },
    });
    expect(sendPushNotification).not.toHaveBeenCalled();
  });
});
