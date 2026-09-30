import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../route';

const mocks = vi.hoisted(() => {
  return {
    mockUsers: [] as any[],
    mockNotificationsUpsert: vi.fn(),
    mockNotificationsSelectResult: Promise.resolve({ data: [] as any[], error: null }),
  };
});

vi.mock('@/lib/push-server', () => ({
  sendPushNotification: vi.fn().mockResolvedValue({ sent: 1, failed: 0 }),
}));

vi.mock('@/lib/sacred-time', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/sacred-time')>();
  return {
    ...actual,
    canSendInLocalWindow: vi.fn().mockReturnValue(true),
    getLocalDateIso: vi.fn().mockReturnValue('2026-09-27'), // Day 1 of the real 2026 window
  };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            or: vi.fn().mockResolvedValue({ data: mocks.mockUsers, error: null }),
          }),
        };
      }
      if (table === 'notifications') {
        return {
          upsert: (...args: unknown[]) => {
            mocks.mockNotificationsUpsert(...args);
            return { select: () => mocks.mockNotificationsSelectResult };
          },
        };
      }
      throw new Error(`Unexpected table access: ${table}`);
    },
  }),
}));

describe('cron/pitru-paksha-reminder location fallback', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.CRON_SECRET = 'cron-secret-123';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    mocks.mockNotificationsUpsert.mockReset();
    mocks.mockNotificationsSelectResult = Promise.resolve({
      data: [{ id: 'notif-1', user_id: 'devotee-no-location', notification_key: 'pitru-paksha:2026-09-27' }],
      error: null,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it('does not drop a devotee who has no latitude/longitude on their profile', async () => {
    mocks.mockUsers = [
      {
        id: 'devotee-no-location',
        full_name: 'No Location Devotee',
        tradition: 'hindu',
        timezone: 'Asia/Kolkata',
        latitude: null,
        longitude: null,
        notification_quiet_hours_start: null,
        notification_quiet_hours_end: null,
      },
    ];

    const request = new Request('https://example.com/api/cron/pitru-paksha-reminder', {
      headers: { authorization: 'Bearer cron-secret-123' },
    });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).not.toBe('No users in 8 AM window');
    expect(mocks.mockNotificationsUpsert).toHaveBeenCalledTimes(1);
    const [insertedBatch] = mocks.mockNotificationsUpsert.mock.calls[0];
    expect(insertedBatch).toEqual([
      expect.objectContaining({ user_id: 'devotee-no-location', notification_key: 'pitru-paksha:2026-09-27' }),
    ]);
  });

  it('still reaches a devotee with their own latitude/longitude (unchanged behavior)', async () => {
    mocks.mockUsers = [
      {
        id: 'devotee-with-location',
        full_name: 'Has Location Devotee',
        tradition: 'hindu',
        timezone: 'Asia/Kolkata',
        latitude: 28.6139,
        longitude: 77.209,
        notification_quiet_hours_start: null,
        notification_quiet_hours_end: null,
      },
    ];
    mocks.mockNotificationsSelectResult = Promise.resolve({
      data: [{ id: 'notif-2', user_id: 'devotee-with-location', notification_key: 'pitru-paksha:2026-09-27' }],
      error: null,
    });

    const request = new Request('https://example.com/api/cron/pitru-paksha-reminder', {
      headers: { authorization: 'Bearer cron-secret-123' },
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mocks.mockNotificationsUpsert).toHaveBeenCalledTimes(1);
  });

  it('returns "No users in 8 AM window" outside the Pitru Paksha window regardless of location', async () => {
    const { getLocalDateIso } = await import('@/lib/sacred-time');
    vi.mocked(getLocalDateIso).mockReturnValue('2026-08-01'); // well outside the window

    mocks.mockUsers = [
      {
        id: 'devotee-no-location',
        full_name: 'No Location Devotee',
        tradition: 'hindu',
        timezone: 'Asia/Kolkata',
        latitude: null,
        longitude: null,
        notification_quiet_hours_start: null,
        notification_quiet_hours_end: null,
      },
    ];

    const request = new Request('https://example.com/api/cron/pitru-paksha-reminder', {
      headers: { authorization: 'Bearer cron-secret-123' },
    });
    const response = await GET(request);
    const body = await response.json();

    expect(body.message).toBe('No users in 8 AM window');
    expect(mocks.mockNotificationsUpsert).not.toHaveBeenCalled();
  });
});
