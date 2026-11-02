import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../route';
import { postSlackOperationalAlert } from '@/lib/slack-alerts';

const mocks = vi.hoisted(() => {
  return {
    mockNativeApiErrors: [] as any[],
    mockClientErrors: [] as any[],
    mockMonEvents: [] as any[],
    mockInsert: vi.fn().mockResolvedValue({ error: null }),
  };
});

vi.mock('@/lib/slack-alerts', () => ({
  postSlackOperationalAlert: vi.fn().mockResolvedValue(true),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'native_api_diagnostic_events') {
        return {
          select: () => ({
            gt: () => ({
              neq: () => ({
                order: () => ({
                  limit: vi.fn().mockResolvedValue({ data: mocks.mockNativeApiErrors, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'client_error_events') {
        return {
          select: () => ({
            gt: () => ({
              order: () => ({
                limit: vi.fn().mockResolvedValue({ data: mocks.mockClientErrors, error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'monitoring_events') {
        return {
          select: () => ({
            gt: () => ({
              in: () => ({
                order: () => ({
                  limit: vi.fn().mockResolvedValue({ data: mocks.mockMonEvents, error: null }),
                }),
              }),
            }),
          }),
          insert: mocks.mockInsert,
        };
      }
      return {
        select: vi.fn(),
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    },
  }),
}));

describe('/api/cron/telemetry-audit', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      CRON_SECRET: 'test-cron-secret-123',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    };
    mocks.mockNativeApiErrors = [];
    mocks.mockClientErrors = [];
    mocks.mockMonEvents = [];
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects requests without CRON_SECRET configured', async () => {
    delete process.env.CRON_SECRET;
    const req = new Request('https://shoonaya.com/api/cron/telemetry-audit');
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('CRON_SECRET');
  });

  it('rejects unauthorized requests', async () => {
    const req = new Request('https://shoonaya.com/api/cron/telemetry-audit', {
      headers: { authorization: 'Bearer wrong-secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('sends test alert when ?test=true', async () => {
    const req = new Request('https://shoonaya.com/api/cron/telemetry-audit?test=true', {
      headers: { authorization: 'Bearer test-cron-secret-123' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.test).toBe(true);
    expect(postSlackOperationalAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('Connectivity Test'),
      })
    );
  });

  it('reports clean status and does not dispatch alert when 0 errors exist', async () => {
    const req = new Request('https://shoonaya.com/api/cron/telemetry-audit', {
      headers: { authorization: 'Bearer test-cron-secret-123' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary.clean).toBe(true);
    expect(body.alertDispatched).toBe(false);
    expect(postSlackOperationalAlert).not.toHaveBeenCalled();
    expect(mocks.mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        error_code: 'TELEMETRY_AUDIT_CLEAN',
      })
    );
  });

  it('dispatches P0 Slack alert when native 5xx server errors are detected', async () => {
    mocks.mockNativeApiErrors = [
      {
        endpoint: '/api/native/japa/complete',
        method: 'POST',
        final_status: 500,
        outcome: 'http_failure',
        duration_ms: 1200,
        received_at: new Date().toISOString(),
      },
    ];

    const req = new Request('https://shoonaya.com/api/cron/telemetry-audit', {
      headers: { authorization: 'Bearer test-cron-secret-123' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary.clean).toBe(false);
    expect(body.summary.nativeServer5xx).toBe(1);
    expect(body.alertDispatched).toBe(true);

    expect(postSlackOperationalAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'P0',
        title: expect.stringContaining('Critical Outages / Errors'),
        desc: expect.stringContaining('/api/native/japa/complete (HTTP 500)'),
      })
    );
  });

  it('dispatches alert when client UI crashes are detected', async () => {
    mocks.mockClientErrors = [
      {
        error_name: 'TypeError',
        error_message: 'Cannot read properties of undefined',
        route: '/home',
        created_at: new Date().toISOString(),
      },
    ];

    const req = new Request('https://shoonaya.com/api/cron/telemetry-audit', {
      headers: { authorization: 'Bearer test-cron-secret-123' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary.clean).toBe(false);
    expect(body.summary.clientCrashes).toBe(1);
    expect(postSlackOperationalAlert).toHaveBeenCalled();
  });
});
