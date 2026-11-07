import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../route';
import { postSlackOperationalAlert } from '@/lib/slack-alerts';

const mocks = vi.hoisted(() => {
  return {
    mockNativeApiErrors: [] as any[],
    mockClientErrors: [] as any[],
    mockMonEvents: [] as any[],
    mockDbError: null as any,
    mockInsert: vi.fn().mockResolvedValue({ error: null }),
    // Populated fresh on every `from(table)` call so a test can assert
    // exactly which filters the route code applied to which table.
    chains: {} as Record<string, { gt: ReturnType<typeof vi.fn>; neq: ReturnType<typeof vi.fn>; in: ReturnType<typeof vi.fn>; order: ReturnType<typeof vi.fn>; limit: ReturnType<typeof vi.fn> }>,
  };
});

vi.mock('@/lib/slack-alerts', () => ({
  postSlackOperationalAlert: vi.fn().mockResolvedValue(true),
}));

// A real-enough query builder: .gt/.neq/.in actually filter the row set
// (so the fix can be proven behaviorally, not just "was the method
// called"), and .limit() resolves the filtered rows -- or mockDbError,
// which every table's query fails with identically, matching the route
// code awaiting all three queries before checking any of their errors.
function makeFilterableBuilder(initialRows: any[]) {
  let rows = [...initialRows];
  const builder: any = {
    gt: vi.fn((col: string, val: string) => {
      rows = rows.filter((r) => r[col] !== undefined && r[col] !== null && String(r[col]) > String(val));
      return builder;
    }),
    neq: vi.fn((col: string, val: unknown) => {
      rows = rows.filter((r) => r[col] !== val);
      return builder;
    }),
    in: vi.fn((col: string, vals: unknown[]) => {
      rows = rows.filter((r) => vals.includes(r[col]));
      return builder;
    }),
    order: vi.fn(() => builder),
    limit: vi.fn(() => {
      if (mocks.mockDbError) return Promise.resolve({ data: null, error: mocks.mockDbError });
      return Promise.resolve({ data: rows, error: null });
    }),
  };
  return builder;
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      const source =
        table === 'native_api_diagnostic_events' ? mocks.mockNativeApiErrors :
        table === 'client_error_events' ? mocks.mockClientErrors :
        table === 'monitoring_events' ? mocks.mockMonEvents :
        [];
      const builder = makeFilterableBuilder(source);
      // monitoring_events is queried via from(table).select(...) AND later
      // written to via from(table).insert(...) (the heartbeat) in the same
      // request. Only the first (select) builder per table is the one a
      // test should assert filter calls against -- keep it, don't let the
      // insert call's fresh builder silently replace it.
      if (!mocks.chains[table]) mocks.chains[table] = builder;
      return {
        select: () => builder,
        insert: mocks.mockInsert,
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
    mocks.mockDbError = null;
    mocks.chains = {};
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
        client_occurred_at: new Date().toISOString(),
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

  it('dispatches P0 Slack alert when database query fails during audit', async () => {
    mocks.mockDbError = { message: 'connection timeout after 5000ms', code: 'CONNECT_TIMEOUT' };

    const req = new Request('https://shoonaya.com/api/cron/telemetry-audit', {
      headers: { authorization: 'Bearer test-cron-secret-123' },
    });
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Database query failed');

    expect(postSlackOperationalAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'P0',
        title: expect.stringContaining('Database Query Failure'),
        desc: expect.stringContaining('connection timeout after 5000ms'),
      })
    );
  });

  // Regression: 2026-11-07 self-echo loop. A heartbeat this cron wrote on a
  // previous run was picked back up as a "critical backend event" by the
  // next run's own query, which produced another heartbeat, forever --
  // confirmed in production across six straight 4-hourly runs with zero
  // real incidents behind any of them.
  describe('monitoring_events self-echo fix', () => {
    it('does not treat its own previous heartbeat as a critical backend event', async () => {
      mocks.mockMonEvents = [
        {
          severity: 'P1',
          domain: 'cron',
          route: '/api/cron/telemetry-audit',
          error_code: 'TELEMETRY_ANOMALIES_DETECTED',
          error_message: 'Audit found 0 5xx errors, 0 crashes, and 1 critical backend events.',
          timestamp: new Date().toISOString(),
        },
      ];

      const req = new Request('https://shoonaya.com/api/cron/telemetry-audit', {
        headers: { authorization: 'Bearer test-cron-secret-123' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(body.summary.criticalBackendEvents).toBe(0);
      expect(body.summary.clean).toBe(true);
      expect(postSlackOperationalAlert).not.toHaveBeenCalled();
      expect(mocks.chains['monitoring_events'].neq).toHaveBeenCalledWith('route', '/api/cron/telemetry-audit');
    });

    it('still alerts on a genuine P0/P1 event from a different route', async () => {
      mocks.mockMonEvents = [
        {
          severity: 'P0',
          domain: 'payments',
          route: '/api/payments/webhook',
          error_code: 'WEBHOOK_SIGNATURE_INVALID',
          error_message: 'Stripe signature verification failed',
          timestamp: new Date().toISOString(),
        },
      ];

      const req = new Request('https://shoonaya.com/api/cron/telemetry-audit', {
        headers: { authorization: 'Bearer test-cron-secret-123' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(body.summary.criticalBackendEvents).toBe(1);
      expect(body.summary.clean).toBe(false);
      expect(postSlackOperationalAlert).toHaveBeenCalled();
    });
  });

  // Regression: the same 2026-11-07 incident's other half. The Native app
  // buffers failed requests offline and flushes them on reconnect, so
  // received_at alone let a 503 from the previous evening (client_occurred_at)
  // count as a live incident just because the device happened to report it
  // within the current audit window.
  describe('native diagnostic staleness fix', () => {
    it('ignores a 5xx whose client_occurred_at falls outside the audit window even though received_at is current', async () => {
      const fifteenHoursAgo = new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString();
      mocks.mockNativeApiErrors = [
        {
          endpoint: '/api/native/home-summary',
          method: 'GET',
          final_status: 503,
          outcome: 'http_failure',
          duration_ms: 22004,
          received_at: new Date().toISOString(),
          client_occurred_at: fifteenHoursAgo,
        },
      ];

      const req = new Request('https://shoonaya.com/api/cron/telemetry-audit', {
        headers: { authorization: 'Bearer test-cron-secret-123' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(body.summary.nativeServer5xx).toBe(0);
      expect(body.summary.clean).toBe(true);
      expect(postSlackOperationalAlert).not.toHaveBeenCalled();
      expect(mocks.chains['native_api_diagnostic_events'].gt).toHaveBeenCalledWith(
        'client_occurred_at',
        expect.any(String)
      );
    });

    it('still alerts on a 5xx that genuinely happened inside the audit window', async () => {
      mocks.mockNativeApiErrors = [
        {
          endpoint: '/api/native/home-summary',
          method: 'GET',
          final_status: 503,
          outcome: 'http_failure',
          duration_ms: 22004,
          received_at: new Date().toISOString(),
          client_occurred_at: new Date().toISOString(),
        },
      ];

      const req = new Request('https://shoonaya.com/api/cron/telemetry-audit', {
        headers: { authorization: 'Bearer test-cron-secret-123' },
      });
      const res = await GET(req);
      const body = await res.json();

      expect(body.summary.nativeServer5xx).toBe(1);
      expect(body.summary.clean).toBe(false);
      expect(postSlackOperationalAlert).toHaveBeenCalled();
    });
  });
});
