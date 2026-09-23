import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';

vi.mock('@/lib/notification-resolver-pipeline', () => ({
  executeCandidateResolverPipeline: vi.fn().mockImplementation(async (opts) => {
    if (!opts.dryRun && process.env.NOTIFICATION_RESOLVER_ENABLED !== 'true') {
      return {
        ok: true,
        skipped: true,
        skipReason: 'resolver_globally_disabled',
        dryRun: false,
        candidatesClaimed: 0,
      };
    }
    return {
      ok: true,
      dryRun: !!opts.dryRun,
      candidatesClaimed: 0,
      acceptedCount: 0,
      suppressedCount: 0,
      deferredCount: 0,
      expiredCount: 0,
      cancelledCount: 0,
      evaluations: [],
      promotedToScheduleCount: 0,
      auditEventsRecorded: 0,
      summary: { totalEvaluated: 0, acceptedCount: 0, suppressedCount: 0, deferredCount: 0, expiredCount: 0, cancelledCount: 0, reasons: {} },
    };
  }),
}));

describe('cron/notification-resolver route', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.CRON_SECRET = 'cron-secret-123';
    process.env.INTERNAL_DISPATCH_SECRET = 'dispatch-secret-456';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('rejects unauthorized requests with 401', async () => {
    const req = new Request('https://shoonaya.com/api/cron/notification-resolver', {
      headers: { authorization: 'Bearer wrong-secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('accepts valid CRON_SECRET and returns pipeline results', async () => {
    delete process.env.NOTIFICATION_RESOLVER_ENABLED;

    const req = new Request('https://shoonaya.com/api/cron/notification-resolver', {
      headers: { authorization: 'Bearer cron-secret-123' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.skipped).toBe(true);
    expect(body.skipReason).toBe('resolver_globally_disabled');
  });

  it('supports dryRun query parameter', async () => {
    const req = new Request('https://shoonaya.com/api/cron/notification-resolver?dryRun=true', {
      headers: { authorization: 'Bearer dispatch-secret-456' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.dryRun).toBe(true);
  });
});
