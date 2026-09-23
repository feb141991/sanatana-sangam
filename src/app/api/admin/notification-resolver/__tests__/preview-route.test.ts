import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../preview/route';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCookieAuth } from '@/lib/admin-auth';
import { requireAdminAccess } from '@/lib/admin';

vi.mock('@/lib/admin-auth', () => ({
  verifyAdminCookieAuth: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({
  requireAdminAccess: vi.fn(),
}));

vi.mock('@/lib/supabase-admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: vi.fn().mockImplementation((table: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    })),
  }),
}));

vi.mock('@/lib/notification-resolver-pipeline', () => ({
  executeCandidateResolverPipeline: vi.fn().mockResolvedValue({
    ok: true,
    dryRun: true,
    candidatesClaimed: 5,
    acceptedCount: 3,
    suppressedCount: 1,
    deferredCount: 1,
    expiredCount: 0,
    cancelledCount: 0,
    evaluations: [],
    promotedToScheduleCount: 0,
    auditEventsRecorded: 0,
    summary: { totalEvaluated: 5, acceptedCount: 3, suppressedCount: 1, deferredCount: 1, expiredCount: 0, cancelledCount: 0, reasons: {} },
  }),
}));

describe('admin/notification-resolver/preview route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated admin with auth error', async () => {
    vi.mocked(verifyAdminCookieAuth).mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('https://shoonaya.com/api/admin/notification-resolver/preview');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns queue stats, pipeline config, and preview simulation for authorized admin', async () => {
    vi.mocked(verifyAdminCookieAuth).mockResolvedValueOnce(null);
    vi.mocked(requireAdminAccess).mockResolvedValueOnce({
      user: { id: 'admin-1', email: 'admin@shoonaya.com' },
    } as any);

    const req = new NextRequest('https://shoonaya.com/api/admin/notification-resolver/preview');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.pipelineConfig).toBeDefined();
    expect(body.queueStats).toBeDefined();
    expect(body.previewSimulation).toBeDefined();
    expect(body.previewSimulation.dryRun).toBe(true);
    expect(body.previewSimulation.candidatesClaimed).toBe(5);
  });
});
