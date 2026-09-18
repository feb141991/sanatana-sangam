import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

type Result = { data: unknown; error: { message: string } | null };
const state = vi.hoisted(() => ({
  results: [] as Result[],
  calls: [] as Array<{ kind: string; value: unknown }>,
}));

function query(result: Result) {
  const chain = {
    eq(column: string, value: unknown) { state.calls.push({ kind: `eq:${column}`, value }); return chain; },
    select(columns: string) { state.calls.push({ kind: 'returning', value: columns }); return chain; },
    maybeSingle: async () => result,
  };
  return chain;
}

vi.mock('@/lib/admin-auth', () => ({
  ADMIN_COOKIE: 'admin_token',
  verifyAdminCookieAuth: async () => null,
  verifyAdminToken: async () => ({ username: 'source-reviewer' }),
}));

vi.mock('@/lib/calendar/fixture-engine-hint', () => ({ computeEngineHint: async () => null }));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: (columns: string) => { state.calls.push({ kind: `select:${table}`, value: columns }); return query(state.results.shift() ?? { data: null, error: null }); },
      update: (payload: unknown) => { state.calls.push({ kind: `update:${table}`, value: payload }); return query(state.results.shift() ?? { data: null, error: null }); },
      insert: (payload: unknown) => { state.calls.push({ kind: `insert:${table}`, value: payload }); return Promise.resolve({ data: null, error: null }); },
    }),
  }),
}));

import { POST } from './route';

const version = '2026-09-15T00:00:00Z';
const candidate = {
  expected: { civilDate: '2027-01-15' },
  source: { tier: 1, ref: 'https://sgpc.net/nanakshahi-calendar/', citation: 'Samvat 558 Gurpurab list 02 Magh' },
  reasoning: 'The published official poster places this Gurpurab here.',
};

function request(patch: unknown) {
  return new NextRequest('http://localhost/api/admin/calendar-governance/fixtures', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', caseId: 'sgpc-candidate', evidenceCorrection: true, expectedUpdatedAt: version, patch }),
  });
}

beforeEach(() => {
  state.results.length = 0;
  state.calls.length = 0;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
});

describe('fixture correction review path', () => {
  it('rejects an impossible date without mutating approval', async () => {
    state.results.push({ data: { case_id: 'sgpc-candidate', approved: true }, error: null });
    const response = await POST(request({ ...candidate, expected: { civilDate: '2027-02-30' } }));
    expect(response.status).toBe(400);
    expect(state.calls.some((call) => call.kind.startsWith('update:'))).toBe(false);
  });

  it('resets approval and uses the supplied fixture version as a conditional edit', async () => {
    state.results.push(
      { data: { case_id: 'sgpc-candidate', approved: true, festival_id: 'guru-gobind-singh-gurpurab', year: 2026, expected: { civilDate: '2027-01-14' }, source: { tier: 1 } }, error: null },
      { data: { case_id: 'sgpc-candidate' }, error: null },
    );
    const response = await POST(request(candidate));
    expect(response.status).toBe(200);
    const payload = state.calls.find((call) => call.kind === 'update:golden_fixtures')?.value as Record<string, unknown>;
    expect(payload.approved).toBe(false);
    expect(payload.reviewed_by).toBeNull();
    expect(payload.expected).toEqual(candidate.expected);
    expect(state.calls).toContainEqual({ kind: 'eq:updated_at', value: version });
  });

  it('returns a conflict when another reviewer changed the fixture first', async () => {
    state.results.push(
      { data: { case_id: 'sgpc-candidate', approved: true, festival_id: 'guru-gobind-singh-gurpurab', year: 2026 }, error: null },
      { data: null, error: null },
    );
    const response = await POST(request(candidate));
    expect(response.status).toBe(409);
  });
});
