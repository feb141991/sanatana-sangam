import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';

// Mock monitoring events
vi.mock('@/lib/monitoring/events', () => ({
  emitEvent: vi.fn(),
}));

describe('GET /api/cron/sattvic-reminder', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      CRON_SECRET: 'test-cron-secret',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('rejects unauthorized requests', async () => {
    const req = new Request('http://localhost/api/cron/sattvic-reminder', {
      headers: { authorization: 'Bearer wrong-secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('halts with skipped: true when pipeline mode is disabled', async () => {
    process.env.NOTIFICATION_ROUTINE_MODE_SATTVIC = 'disabled';

    const req = new Request('http://localhost/api/cron/sattvic-reminder', {
      headers: { authorization: 'Bearer test-cron-secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.skipped).toBe(true);
    expect(body.pipeline_mode).toBe('disabled');
    expect(body.reason).toBe('sattvic_reminders_disabled_by_policy');
  });

  it('produces candidates into notification_candidates under candidate mode', async () => {
    process.env.NOTIFICATION_ROUTINE_MODE_SATTVIC = 'candidate';

    const upsertCandidateMock = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [{ id: 'cand-sattvic-1' }], error: null }),
    });

    const createClientMock = vi.fn().mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'user-sattvic-1',
                      full_name: 'Sattvic Devotee',
                      tradition: 'hindu',
                      timezone: 'Asia/Kolkata',
                      notification_quiet_hours_start: null,
                      notification_quiet_hours_end: null,
                      wants_nitya_reminders: true,
                      is_deleting: false,
                    },
                  ],
                  error: null,
                }),
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
    const req = new Request('http://localhost/api/cron/sattvic-reminder', {
      headers: { authorization: 'Bearer test-cron-secret' },
    });
    const res = await routeGet(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.pipeline_mode).toBe('candidate');
    expect(body.candidates_produced).toBe(1);
    expect(upsertCandidateMock).toHaveBeenCalledTimes(1);
  });

  it('enqueues into notification_schedule under legacy mode', async () => {
    process.env.NOTIFICATION_ROUTINE_MODE_SATTVIC = 'legacy';

    const upsertScheduleMock = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [{ id: 'sched-sattvic-1' }], error: null }),
    });

    const createClientMock = vi.fn().mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'user-sattvic-1',
                      full_name: 'Sattvic Devotee',
                      tradition: 'hindu',
                      timezone: 'Asia/Kolkata',
                      notification_quiet_hours_start: null,
                      notification_quiet_hours_end: null,
                      wants_nitya_reminders: true,
                      is_deleting: false,
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'notification_schedule') {
          return { upsert: upsertScheduleMock };
        }
        throw new Error(`Unexpected table access: ${table}`);
      }),
    });

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: createClientMock,
    }));

    const { GET: routeGet } = await import('../route');
    const req = new Request('http://localhost/api/cron/sattvic-reminder', {
      headers: { authorization: 'Bearer test-cron-secret' },
    });
    const res = await routeGet(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pipeline_mode).toBe('legacy');
    expect(body.enqueued).toBe(1);
    expect(upsertScheduleMock).toHaveBeenCalledTimes(1);
  });
});
