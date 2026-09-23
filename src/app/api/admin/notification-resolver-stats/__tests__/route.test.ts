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
      select: vi.fn().mockImplementation(() => {
        const auditRows = Array.from({ length: 502 }, (_, index) => ({
          id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
          resolved_at: new Date(Date.UTC(2026, 8, 23, 12, 0, index)).toISOString(),
          decision: index === 0 ? 'accepted' : index === 1 ? 'deferred' : 'suppressed',
          reason: index === 0 ? 'within_budget' : index === 1 ? 'window_open_next_slot' : 'daily_devotional_budget_exceeded',
          event_type: index % 2 === 0 ? 'observance' : 'routine_engagement',
        }));
        let cursorId: string | null = null;
        const query = {
          eq: vi.fn(() => query),
          lte: vi.fn(() => table === 'notification_resolver_events'
            ? query
            : Promise.resolve({ count: 2, error: null })),
          gte: vi.fn(() => query),
          or: vi.fn((expression: string) => {
            cursorId = expression.slice(expression.lastIndexOf('.') + 1);
            return query;
          }),
          order: vi.fn(() => query),
          limit: vi.fn(async (limit: number) => {
            const rows = cursorId
              ? auditRows.filter((row) => row.id > cursorId!)
              : auditRows;
            return {
            data: table === 'notification_resolver_events' ? rows.slice(0, limit) : [],
            error: null,
          }; }),
          then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
            Promise.resolve({ count: 2, error: null }).then(resolve, reject),
        };
        return query;
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
    expect(body.last24h.totalEvaluated).toBe(502);
    expect(body.last24h.accepted).toBe(1);
    expect(body.last24h.suppressed).toBe(500);
    expect(body.last24h.deferred).toBe(1);
    expect(body.last24h.topSuppressionReasons).toHaveLength(3);
    expect(body.last7d).toBeDefined();
  });
});
