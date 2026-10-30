import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getShields } from './route';
import { GET as getProgress } from '@/app/api/native/progress/route';
import { nativeProgressWindow } from '@/lib/native-progress-window';

const mock = vi.hoisted(() => ({
  user: { id: 'viewer-1' } as { id: string } | null,
  client: null as unknown,
}));

vi.mock('@/lib/api-auth', () => ({
  getApiUser: async () => ({
    user: mock.user,
    supabase: mock.client,
    error: mock.user ? null : Object.assign(new Error('Unauthorized'), { status: 401, code: 'AUTH_REQUIRED' }),
  }),
  getApiAuthFailureResponse: (error: unknown, headers?: HeadersInit) =>
    new Response(JSON.stringify({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }), { status: 401, headers }),
}));

function mockDb(options: {
  sadhana?: Array<{ streak_count: number | null; date: string; user_id?: string }>;
  sadhanaError?: { code: string };
  sessionsCount?: number | null;
  sessionsError?: { code: string };
}) {
  const sadhanaRows = options.sadhana ?? [];
  return {
    from: (table: string) => {
      if (table === 'daily_sadhana') {
        const query: any = {
          select: () => query,
          eq: () => query,
          gte: () => query,
          lte: () => query,
          order: () => query,
          limit: () => query,
          maybeSingle: async () => {
            if (options.sadhanaError) return { data: null, error: options.sadhanaError };
            const row = sadhanaRows[0] ?? null;
            return { data: row ? { streak_count: row.streak_count } : null, error: null };
          },
        };
        return query;
      }
      if (table === 'mala_sessions') {
        const query: any = {
          select: (_cols: string, opts?: { count?: string; head?: boolean }) => {
            return query;
          },
          eq: () => query,
          then: (resolve: (val: any) => any) => {
            if (options.sessionsError) {
              return Promise.resolve(resolve({ data: null, error: options.sessionsError, count: null }));
            }
            return Promise.resolve(resolve({ data: null, error: null, count: options.sessionsCount !== undefined ? options.sessionsCount : 0 }));
          },
        };
        return query;
      }
      if (table === 'profiles') {
        return {
          select: () => ({ eq: () => ({ single: async () => ({ data: { full_name: 'Tester' }, error: null }) }) }),
        };
      }
      if (table === 'nitya_karma_log' || table === 'karma_ledger' || table === 'quiz_responses') {
        return {
          select: () => ({ eq: () => ({ gte: () => ({ lte: async () => ({ data: [], error: null }) }) }) }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    },
  };
}

describe('GET /api/native/progress/shields', () => {
  beforeEach(() => {
    mock.user = { id: 'viewer-1' };
  });

  it('returns exactly what Shields derived from /api/native/progress', async () => {
    const { today, start182d } = nativeProgressWindow();
    const rows = [
      { date: today, streak_count: 14, user_id: 'viewer-1' },
      { date: start182d, streak_count: 5, user_id: 'viewer-1' },
    ];
    mock.client = mockDb({ sadhana: rows, sessionsCount: 42 });

    const req = new NextRequest('http://localhost:3000/api/native/progress/shields');
    const res = await getShields(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toEqual({
      latestStreakCount: 14,
      totalJapaSessions: 42,
    });
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    expect(res.headers.get('Server-Timing')).toContain('total');
  });

  it('defaults null streak_count to 0', async () => {
    mock.client = mockDb({ sadhana: [{ date: '2026-10-30', streak_count: null }], sessionsCount: 10 });
    const res = await getShields(new NextRequest('http://localhost:3000/api/native/progress/shields'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.latestStreakCount).toBe(0);
    expect(body.totalJapaSessions).toBe(10);
  });

  it('defaults empty sadhana history to streak 0', async () => {
    mock.client = mockDb({ sadhana: [], sessionsCount: 0 });
    const res = await getShields(new NextRequest('http://localhost:3000/api/native/progress/shields'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ latestStreakCount: 0, totalJapaSessions: 0 });
  });

  it('fails with 503 when daily_sadhana read fails (never returns 0 shields on failure)', async () => {
    mock.client = mockDb({ sadhanaError: { code: '57014' }, sessionsCount: 25 });
    const res = await getShields(new NextRequest('http://localhost:3000/api/native/progress/shields'));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe('PROGRESS_UNAVAILABLE');
    expect(res.headers.get('Retry-After')).toBe('5');
  });

  it('fails with 503 when mala_sessions count fails (never returns 0 shields on failure)', async () => {
    mock.client = mockDb({ sadhana: [{ date: '2026-10-30', streak_count: 5 }], sessionsError: { code: '57014' } });
    const res = await getShields(new NextRequest('http://localhost:3000/api/native/progress/shields'));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe('PROGRESS_UNAVAILABLE');
  });

  it('fails with 503 when mala_sessions count is null', async () => {
    mock.client = mockDb({ sadhana: [{ date: '2026-10-30', streak_count: 5 }], sessionsCount: null });
    const res = await getShields(new NextRequest('http://localhost:3000/api/native/progress/shields'));
    expect(res.status).toBe(503);
  });

  it('returns 401 when unauthenticated', async () => {
    mock.user = null;
    const res = await getShields(new NextRequest('http://localhost:3000/api/native/progress/shields'));
    expect(res.status).toBe(401);
  });
});
