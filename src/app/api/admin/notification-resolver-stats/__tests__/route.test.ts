import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
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
        eq: vi.fn().mockReturnValue({
          lte: vi.fn().mockResolvedValue({ count: 2, error: null }),
        }),
        gte: vi.fn().mockResolvedValue({
          data: [
            { decision: 'accepted', reason: 'within_budget', event_type: 'observance' },
            { decision: 'suppressed', reason: 'daily_devotional_budget_exceeded', event_type: 'routine_engagement' },
            { decision: 'deferred', reason: 'window_open_next_slot', event_type: 'quiz' },
          ],
          error: null,
        }),
      }),
    })),
  }),
}));

describe('admin/notification-resolver-stats route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated admin with auth error', async () => {
    vi.mocked(verifyAdminCookieAuth).mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('https://shoonaya.com/api/admin/notification-resolver-stats');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns resolver governance, queue counts, and 24h/7d metrics for authorized admin', async () => {
    vi.mocked(verifyAdminCookieAuth).mockResolvedValueOnce(null);
    vi.mocked(requireAdminAccess).mockResolvedValueOnce({
      user: { id: 'admin-1', email: 'admin@shoonaya.com' },
    } as any);

    const req = new NextRequest('https://shoonaya.com/api/admin/notification-resolver-stats');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.governance).toBeDefined();
    expect(body.governance.pipelineModes).toBeDefined();
    expect(body.queue).toBeDefined();
    expect(body.last24h).toBeDefined();
    expect(body.last24h.totalEvaluated).toBe(3);
    expect(body.last24h.accepted).toBe(1);
    expect(body.last24h.suppressed).toBe(1);
    expect(body.last24h.deferred).toBe(1);
    expect(body.last24h.topSuppressionReasons).toHaveLength(3);
    expect(body.last7d).toBeDefined();
  });
});
