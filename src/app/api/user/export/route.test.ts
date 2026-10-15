import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  user: { id: 'user-1' } as { id: string } | null,
  rows: {} as Record<string, unknown[]>,
  errors: {} as Record<string, { code: string; message: string }>,
  filters: [] as Array<{ table: string; column: string; value: unknown }>,
  selects: {} as Record<string, string>,
}));

vi.mock('@/lib/api-auth', () => ({
  getApiUser: vi.fn(async () => ({ user: mocks.user, error: mocks.user ? null : 'unauthenticated' })),
  getApiAuthFailureResponse: vi.fn(() => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })),
}));

vi.mock('@/lib/supabase-admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const result = () => ({ data: mocks.errors[table] ? null : (mocks.rows[table] ?? []), error: mocks.errors[table] ?? null });
      const chain: Record<string, unknown> = {};
      chain.select = (columns: string) => { mocks.selects[table] = columns; return chain; };
      chain.eq = (column: string, value: unknown) => { mocks.filters.push({ table, column, value }); return chain; };
      chain.gte = () => chain;
      chain.order = () => chain;
      chain.single = async () => ({ data: { id: 'user-1' }, error: null });
      chain.then = (resolve: (value: ReturnType<typeof result>) => unknown) => resolve(result());
      return chain;
    },
  }),
}));

import { GET } from './route';

const request = () => new NextRequest('https://shoonaya.com/api/user/export');

describe('GET /api/user/export', () => {
  beforeEach(() => {
    mocks.user = { id: 'user-1' };
    mocks.rows = {};
    mocks.errors = {};
    mocks.filters = [];
    mocks.selects = {};
  });

  it('includes the account\'s product-measurement entries and performance diagnostics', async () => {
    mocks.rows.native_product_analytics_daily = [
      { event_name: 'app_opened', event_date: '2026-10-11', app_version: '1.4.0', platform: 'ios', recorded_at: '2026-10-11T08:00:00Z' },
      { event_name: 'practice_completed', event_date: '2026-10-10', app_version: '1.4.0', platform: 'ios', recorded_at: '2026-10-10T19:00:00Z' },
    ];
    mocks.rows.native_startup_telemetry_summaries = [
      { schema_version: 3, app_version: '1.4.0', platform: 'ios', total_events: 12, summary: { routes: {} }, received_at: '2026-10-11T09:00:00Z' },
    ];

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.product_analytics_events).toHaveLength(2);
    expect(body.product_analytics_events.map((row: { event_name: string }) => row.event_name))
      .toEqual(['app_opened', 'practice_completed']);
    expect(body.app_performance_diagnostics).toHaveLength(1);
    expect(mocks.filters).toContainEqual({ table: 'native_product_analytics_daily', column: 'user_id', value: 'user-1' });
    expect(mocks.filters).toContainEqual({ table: 'native_startup_telemetry_summaries', column: 'user_id', value: 'user-1' });
    // The account id is already the export's own user_id; rows do not repeat it.
    expect(mocks.selects.native_product_analytics_daily).not.toContain('user_id');
    expect(mocks.selects.native_startup_telemetry_summaries).not.toContain('user_id');
  });

  it('still exports everything else when the analytics table is not migrated yet', async () => {
    mocks.errors.native_product_analytics_daily = { code: '42P01', message: 'relation does not exist' };
    mocks.rows.quiz_responses = [{ id: 'q1' }];

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.product_analytics_events).toEqual([]);
    expect(body.quiz_results).toEqual([{ id: 'q1' }]);
  });

  it('rejects unauthenticated callers', async () => {
    mocks.user = null;
    const response = await GET(request());
    expect(response.status).toBe(401);
  });
});
