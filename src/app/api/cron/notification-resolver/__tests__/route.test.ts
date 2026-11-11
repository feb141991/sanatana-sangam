import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';
import { executeCandidateResolverPipeline } from '@/lib/notification-resolver-pipeline';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ rpc }) }));

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
    delete process.env.NOTIFICATION_RESOLVER_ENABLED;
    vi.clearAllMocks();
    rpc.mockResolvedValue({ data: 'engagement-cadence-v3', error: null });
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

  it('supports dryRun without a database policy check during the rollout', async () => {
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
    const req = new Request('https://shoonaya.com/api/cron/notification-resolver?dryRun=true', {
      headers: { authorization: 'Bearer dispatch-secret-456' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.dryRun).toBe(true);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('passes runRetentionCleanup=true only when retention=true param is supplied', async () => {
    const { executeCandidateResolverPipeline } = await import('@/lib/notification-resolver-pipeline');

    // Default call without ?retention=true should have runRetentionCleanup=false
    const reqDefault = new Request('https://shoonaya.com/api/cron/notification-resolver', {
      headers: { authorization: 'Bearer dispatch-secret-456' },
    });
    await GET(reqDefault);
    expect(executeCandidateResolverPipeline).toHaveBeenLastCalledWith(
      expect.objectContaining({ runRetentionCleanup: false })
    );

    // Call with ?retention=true should have runRetentionCleanup=true
    const reqRetention = new Request('https://shoonaya.com/api/cron/notification-resolver?retention=true', {
      headers: { authorization: 'Bearer dispatch-secret-456' },
    });
    await GET(reqRetention);
    expect(executeCandidateResolverPipeline).toHaveBeenLastCalledWith(
      expect.objectContaining({ runRetentionCleanup: true })
    );
  });
  it.each([
    { data: null, error: { code: 'PGRST202' } },
    { data: 'engagement-cadence-v2', error: null },
  ])('does not claim candidates against an old database: %j', async (database) => {
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
    process.env.VERCEL_GIT_COMMIT_SHA = 'test-release';
    rpc.mockResolvedValue(database);
    const res = await GET(new Request('https://shoonaya.com/api/cron/notification-resolver', {
      headers: { authorization: 'Bearer cron-secret-123' },
    }));
    expect(await res.json()).toMatchObject({ skipped: true, skipReason: 'cadence_version_mismatch', candidatesClaimed: 0,
      revision: 'test-release', cadenceVersion: 'engagement-cadence-v3' });
    expect(executeCandidateResolverPipeline).not.toHaveBeenCalled();
  });

  it('permits live work only when the database reports the same version', async () => {
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
    const res = await GET(new Request('https://shoonaya.com/api/cron/notification-resolver', {
      headers: { authorization: 'Bearer cron-secret-123' },
    }));
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('notification_cadence_policy_version');
    expect(executeCandidateResolverPipeline).toHaveBeenCalledOnce();
  });

  it('reports a failed database version read without claiming work', async () => {
    process.env.NOTIFICATION_RESOLVER_ENABLED = 'true';
    rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'private database detail' } });
    const res = await GET(new Request('https://shoonaya.com/api/cron/notification-resolver', {
      headers: { authorization: 'Bearer cron-secret-123' },
    }));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ ok: false, error: 'cadence_version_check_unavailable' });
    expect(executeCandidateResolverPipeline).not.toHaveBeenCalled();
  });

});
