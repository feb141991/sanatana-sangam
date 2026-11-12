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
      chain.or = () => chain;
      chain.order = () => chain;
      chain.range = () => chain;
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

  it('includes the account\'s notification taps, and only that account\'s, with no message text', async () => {
    mocks.rows.notification_taps = [
      { notification_key: 'quiz:k1', notification_type: 'quiz', tapped_at: '2026-11-12T05:31:00Z', launch_state: 'cold_start', app_version: '1.4.0', platform: 'ios', recorded_at: '2026-11-12T05:31:02Z' },
    ];
    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.notification_taps).toHaveLength(1);
    expect(body.notification_taps[0]).toMatchObject({ notification_key: 'quiz:k1', notification_type: 'quiz', launch_state: 'cold_start' });
    expect(mocks.filters).toContainEqual({ table: 'notification_taps', column: 'user_id', value: 'user-1' });
    // The export already carries the account id; rows do not repeat it, and nothing identifies another person.
    expect(mocks.selects.notification_taps).not.toMatch(/user_id|client_event_id|title|body|url/);
  });

  it('exports an empty tap list, and everything else, before the tap table is migrated', async () => {
    mocks.errors.notification_taps = { code: '42P01', message: 'relation does not exist' };
    mocks.rows.quiz_responses = [{ id: 'q1' }];
    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.notification_taps).toEqual([]);
    expect(body.quiz_results).toEqual([{ id: 'q1' }]);
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

  it('includes the rest of the account\'s data, with secrets removed, and says what the file leaves out', async () => {
    mocks.rows.journal_entries = [{ id: 'j1', user_id: 'user-1', body: 'a private note' }];
    mocks.rows.posts = [{ id: 'p1', author_id: 'user-1', content: 'hello' }];
    mocks.rows.push_tokens = [{ id: 't1', user_id: 'user-1', platform: 'ios', token: 'ExponentPushToken[secret]' }];
    mocks.rows.kul_invitations = [{ id: 'i1', created_by: 'user-1', token: 'join-secret' }];

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.other_data.journal_entries).toEqual([{ id: 'j1', user_id: 'user-1', body: 'a private note' }]);
    expect(body.other_data.posts).toHaveLength(1);
    // Tables with no rows are not listed, and secrets never reach the file.
    expect(body.other_data.tirtha_visits).toBeUndefined();
    expect(body.other_data.push_tokens[0]).toMatchObject({ platform: 'ios', token: '[redacted: secret value]' });
    expect(body.other_data.kul_invitations[0].token).toBe('[redacted: secret value]');
    expect(JSON.stringify(body)).not.toMatch(/ExponentPushToken\[secret\]|join-secret/);
    expect(body.export_notes.not_included.sanskara).toMatch(/Settings/);
    expect(body.export_notes.not_included.uploaded_files).toMatch(/not part of this JSON/);
    expect(body.export_notes.incomplete_tables).toEqual([]);
    expect(mocks.filters).toContainEqual({ table: 'journal_entries', column: 'user_id', value: 'user-1' });
    expect(mocks.filters).toContainEqual({ table: 'posts', column: 'author_id', value: 'user-1' });
  });

  it('lists a table it could not read instead of presenting the file as complete', async () => {
    mocks.errors.journal_entries = { code: '57014', message: 'statement timeout' };
    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.export_notes.incomplete_tables).toContainEqual({ table: 'journal_entries', reason: 'read_failed' });
    expect(JSON.stringify(body.export_notes)).not.toMatch(/statement timeout/);
  });

  it('exports all history of the tables it used to cut at 90 days', async () => {
    mocks.rows.daily_sadhana = [{ id: 'old', date: '2024-01-01' }];
    mocks.rows.mala_sessions = [{ id: 'old', created_at: '2024-01-01T00:00:00Z' }];
    const body = await (await GET(request())).json();
    expect(body.daily_sadhana).toEqual([{ id: 'old', date: '2024-01-01' }]);
    expect(body.mala_sessions).toHaveLength(1);
    expect(body).not.toHaveProperty('daily_sadhana_last_90_days');
  });

  it('rejects unauthenticated callers', async () => {
    mocks.user = null;
    const response = await GET(request());
    expect(response.status).toBe(401);
  });
});
