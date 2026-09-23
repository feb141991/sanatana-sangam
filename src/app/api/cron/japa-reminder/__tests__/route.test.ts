import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../route';
import { sendPushNotification } from '@/lib/push-server';

const mocks = vi.hoisted(() => {
  return {
    mockUsers: [
      {
        id: 'devotee-1',
        timezone: 'Asia/Kolkata',
        japa_reminder_enabled: true,
        japa_reminder_time: '07:00',
      },
    ],
    mockCandidatesUpsert: vi.fn(),
    mockNotificationsUpsert: vi.fn(),
  };
});

vi.mock('@/lib/push-server', () => ({
  sendPushNotification: vi.fn().mockResolvedValue({ sent: 1, failed: 0 }),
}));

vi.mock('@/lib/notification-templates', () => ({
  resolveNotificationCopy: vi.fn().mockResolvedValue({
    title: '🔔 Time for Japa',
    body: 'Your daily Japa practice awaits. Keep your streak alive 🙏',
  }),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mocks.mockUsers, error: null }),
          }),
        };
      }
      if (table === 'daily_sadhana') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }), // Incomplete
            }),
          }),
        };
      }
      if (table === 'notification_candidates') {
        return {
          upsert: mocks.mockCandidatesUpsert,
        };
      }
      if (table === 'notifications') {
        return {
          upsert: mocks.mockNotificationsUpsert,
        };
      }
      throw new Error(`Unexpected table access: ${table}`);
    },
  }),
}));

describe('cron/japa-reminder pipeline exclusivity', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.CRON_SECRET = 'cron-secret-123';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    vi.clearAllMocks();

    mocks.mockCandidatesUpsert.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [{ id: 'cand-japa-1' }], error: null }),
    });

    mocks.mockNotificationsUpsert.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [{ id: 'notif-1', user_id: 'devotee-1' }], error: null }),
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('rejects unauthorized requests with 401', async () => {
    const req = new Request('https://shoonaya.com/api/cron/japa-reminder', {
      headers: { authorization: 'Bearer wrong-secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('aborts immediately when pipeline mode is disabled', async () => {
    process.env.NOTIFICATION_ROUTINE_MODE_JAPA = 'disabled';

    const req = new Request('https://shoonaya.com/api/cron/japa-reminder', {
      headers: { authorization: 'Bearer cron-secret-123' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.skipped).toBe(true);
    expect(body.pipeline_mode).toBe('disabled');
    expect(body.reason).toBe('japa_reminders_disabled_by_policy');
    expect(sendPushNotification).not.toHaveBeenCalled();
    expect(mocks.mockCandidatesUpsert).not.toHaveBeenCalled();
    expect(mocks.mockNotificationsUpsert).not.toHaveBeenCalled();
  });

  it('executes candidate pipeline when mode is candidate with zero push calls', async () => {
    process.env.NOTIFICATION_ROUTINE_MODE_JAPA = 'candidate';

    const req = new Request('https://shoonaya.com/api/cron/japa-reminder', {
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
    // Assert legacy notifications NOT inserted
    expect(mocks.mockNotificationsUpsert).not.toHaveBeenCalled();
  });

  it('executes legacy pipeline when mode is legacy (or unset)', async () => {
    delete process.env.NOTIFICATION_ROUTINE_MODE_JAPA;

    const req = new Request('https://shoonaya.com/api/cron/japa-reminder', {
      headers: { authorization: 'Bearer cron-secret-123' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.pipeline_mode).toBe('legacy');

    // Assert push was called in legacy mode
    expect(sendPushNotification).toHaveBeenCalledTimes(1);
    // Assert legacy notifications upserted
    expect(mocks.mockNotificationsUpsert).toHaveBeenCalledTimes(1);
    // Assert zero candidate rows upserted
    expect(mocks.mockCandidatesUpsert).not.toHaveBeenCalled();
  });
});
