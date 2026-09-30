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

vi.mock('@/lib/pitru-paksha', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/pitru-paksha')>();
  return { ...actual, getPitruPakshaDay: vi.fn(actual.getPitruPakshaDay) };
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
    delete process.env.NOTIFICATION_RESOLVER_ENABLED;
    delete process.env.NOTIFICATION_CANDIDATE_MODE_OBSERVANCE_SERIES;
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
        wants_festival_reminders: true,
        is_deleting: false,
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
        wants_festival_reminders: true,
        is_deleting: false,
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
        wants_festival_reminders: true,
        is_deleting: false,
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


describe('Pitru delivery ownership and consent', () => {
  const request = () => new Request('https://example.com/api/cron/pitru-paksha-reminder', {
    headers: { authorization: 'Bearer cron-secret-123' },
  });
  beforeEach(() => {
    process.env.CRON_SECRET = 'cron-secret-123';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-placeholder';
    delete process.env.NOTIFICATION_RESOLVER_ENABLED;
    delete process.env.NOTIFICATION_CANDIDATE_MODE_OBSERVANCE_SERIES;
    mocks.mockNotificationsUpsert.mockReset();
    mocks.mockUsers = [{ id: 'no-gps', tradition: 'hindu', timezone: 'Europe/London',
      latitude: null, longitude: null, wants_festival_reminders: true, is_deleting: false }];
  });
  afterEach(() => { delete process.env.NOTIFICATION_RESOLVER_ENABLED; delete process.env.NOTIFICATION_CANDIDATE_MODE_OBSERVANCE_SERIES; });

  it('does not send legacy pushes once the series candidate resolver owns delivery', async () => {
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
    process.env.NOTIFICATION_CANDIDATE_MODE_OBSERVANCE_SERIES = 'candidate';
    const response = await GET(request());
    expect(await response.json()).toMatchObject({ sent: 0, skipped: true });
    expect(mocks.mockNotificationsUpsert).not.toHaveBeenCalled();
  });

  it.each([false, null, undefined])('does not send without explicit festival consent (%s)', async (consent) => {
    mocks.mockUsers[0].wants_festival_reminders = consent;
    await GET(request());
    expect(mocks.mockNotificationsUpsert).not.toHaveBeenCalled();
  });

  it('does not send to a deleting account', async () => {
    mocks.mockUsers[0].is_deleting = true;
    await GET(request());
    expect(mocks.mockNotificationsUpsert).not.toHaveBeenCalled();
  });

  it('keeps the full Ujjain calculation context for a London user without GPS', async () => {
    const { getLocalDateIso } = await import('@/lib/sacred-time');
    vi.mocked(getLocalDateIso).mockReturnValue('2026-09-27');
    const { getPitruPakshaDay } = await import('@/lib/pitru-paksha');
    vi.mocked(getPitruPakshaDay).mockClear();
    await GET(request());
    expect(getPitruPakshaDay).toHaveBeenCalledWith('2026-09-27',
      expect.objectContaining({ lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' }));
  });
});
