import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../route';
import { sendPushNotification } from '@/lib/push-server';

const mocks = vi.hoisted(() => {
  return {
    mockUsers: [
      {
    id: 'devotee-shloka-1',
        full_name: 'Devotee One',
        tradition: 'hindu',
        timezone: 'Asia/Kolkata',
        shloka_streak: 3,
        last_shloka_date: '2026-11-07', // Not yet read for the target date below.
        wants_shloka_reminders: true,
        latitude: null,
        longitude: null,
        notification_quiet_hours_start: null,
        notification_quiet_hours_end: null,
      },
    ],
    mockCandidatesUpsert: vi.fn(),
    mockQueue: vi.fn(),
  };
});

vi.mock('@/lib/push-server', () => ({
  sendPushNotification: vi.fn().mockResolvedValue({ sent: 1, failed: 0 }),
}));

vi.mock('@/lib/sacred-time', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/sacred-time')>();
  return {
    ...actual,
    getNextLocalHourUtc: vi.fn(() => ({
      sendAt: new Date('2026-11-08T13:30:00.000Z'),
      localDateIso: '2026-11-08',
      localHour: 19,
    })),
  };
});

vi.mock('@/lib/notification-schedule-queue', () => ({
  enqueueNotificationSchedule: mocks.mockQueue,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockResolvedValue({ data: mocks.mockUsers, error: null }),
        };
      }
      if (table === 'notification_candidates') {
        return {
          upsert: mocks.mockCandidatesUpsert,
        };
      }
      throw new Error(`Unexpected table access: ${table}`);
    },
  }),
}));

describe('cron/shloka-reminder pipeline exclusivity', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.CRON_SECRET = 'cron-secret-123';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    vi.clearAllMocks();

    mocks.mockCandidatesUpsert.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [{ id: 'cand-shloka-1' }], error: null }),
    });
    mocks.mockQueue.mockResolvedValue({ queued: 1, ignored: 0 });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('rejects unauthorized requests with 401', async () => {
    const req = new Request('https://shoonaya.com/api/cron/shloka-reminder', {
      headers: { authorization: 'Bearer wrong-secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('aborts immediately when pipeline mode is disabled', async () => {
    process.env.NOTIFICATION_ROUTINE_MODE_SHLOKA = 'disabled';

    const req = new Request('https://shoonaya.com/api/cron/shloka-reminder', {
      headers: { authorization: 'Bearer cron-secret-123' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.skipped).toBe(true);
    expect(body.pipeline_mode).toBe('disabled');
    expect(body.reason).toBe('shloka_reminders_disabled_by_policy');
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(mocks.mockCandidatesUpsert).not.toHaveBeenCalled();
    expect(mocks.mockQueue).not.toHaveBeenCalled();
  });

  it('executes candidate pipeline when mode is candidate with zero push calls', async () => {
    process.env.NOTIFICATION_ROUTINE_MODE_SHLOKA = 'candidate';
    const req = new Request('https://shoonaya.com/api/cron/shloka-reminder', {
      headers: { authorization: 'Bearer cron-secret-123' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.pipeline_mode).toBe('candidate');
    expect(body.eligibleCount).toBe(1);
    expect(body.candidatesCreated).toBe(1);

    // Assert zero push calls in candidate mode
    expect(sendPushNotification).not.toHaveBeenCalled();
    // Assert candidate upsert called
    expect(mocks.mockCandidatesUpsert).toHaveBeenCalledTimes(1);
    const candidate = mocks.mockCandidatesUpsert.mock.calls[0][0][0];
    expect(candidate.scheduled_for).toBe('2026-11-08T13:30:00.000Z');
    // Legacy queue is not involved in candidate mode.
    expect(mocks.mockQueue).not.toHaveBeenCalled();
  });

  it('queues the next local reminder slot in legacy mode without sending immediately', async () => {
    delete process.env.NOTIFICATION_ROUTINE_MODE_SHLOKA;

    const req = new Request('https://shoonaya.com/api/cron/shloka-reminder', {
      headers: { authorization: 'Bearer cron-secret-123' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.pipeline_mode).toBe('legacy');

    expect(body.message).toBe('Shloka reminders queued');
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(mocks.mockQueue).toHaveBeenCalledTimes(1);
    const [, scheduleRows] = mocks.mockQueue.mock.calls[0];
    expect(scheduleRows[0]).toMatchObject({
      notification_type: 'shloka',
      send_at: '2026-11-08T13:30:00.000Z',
      notification_key: 'shloka:devotee-shloka-1:2026-11-08',
      metadata: { local_date: '2026-11-08', timezone: 'Asia/Kolkata', type: 'streak' },
    });
    // Assert zero candidate rows upserted
    expect(mocks.mockCandidatesUpsert).not.toHaveBeenCalled();
  });

  it('does not discard legacy recipients based on the cron UTC hour', async () => {
    delete process.env.NOTIFICATION_ROUTINE_MODE_SHLOKA;

    const req = new Request('https://shoonaya.com/api/cron/shloka-reminder', {
      headers: { authorization: 'Bearer cron-secret-123' },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ pipeline_mode: 'legacy', scheduled_candidates: 1, enqueued: 1 });
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(mocks.mockQueue).toHaveBeenCalledTimes(1);
    expect(mocks.mockCandidatesUpsert).not.toHaveBeenCalled();
  });
});
