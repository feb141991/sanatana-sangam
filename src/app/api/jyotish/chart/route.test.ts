import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { createClient, getApiUser, generateAstroChart, deriveDenormalizedBirthProfileFields, dbState } = vi.hoisted(() => ({
  createClient: vi.fn(),
  getApiUser: vi.fn(),
  generateAstroChart: vi.fn(),
  deriveDenormalizedBirthProfileFields: vi.fn(),
  dbState: { inserted: [] as Record<string, unknown>[], insertErrors: [] as Array<{ code: string; message: string }>, omitReadback: false },
}));

vi.mock('@supabase/supabase-js', () => ({ createClient }));
vi.mock('@/lib/api-auth', () => ({ getApiUser }));
vi.mock('@/lib/jyotish/astro-engine', () => ({ generateAstroChart, deriveDenormalizedBirthProfileFields }));

import { POST } from './route';

const chart = { planets: [{ planet: 'Moon', longitude: 281.25 }], houses: [1, 2, 3] };
const summary = {
  rashi: 'Makara', sun_rashi: 'Kanya', nakshatra: 'Shravana', nakshatra_pada: 2,
  nakshatra_lord: 'Moon', lagna: 'Mesha', lagna_deg: 4.25, ayanamsa: 24.1,
  current_dasha_planet: 'Guru', current_dasha_end_date: '2030-01-01', next_dasha_planet: 'Shani',
};

function makeDb() {
  return {
    from: (table: string) => {
      if (table !== 'birth_profiles') throw new Error(`Unexpected table: ${table}`);
      return {
        select: () => {
          const filters: Record<string, unknown> = {};
          const query = {
            eq: (column: string, value: unknown) => { filters[column] = value; return query; },
            is: (column: string, value: unknown) => { filters[column] = value; return query; },
            maybeSingle: async () => ({
              data: dbState.inserted.find((row) => Object.entries(filters).every(([column, value]) => row[column] === value)) ?? null,
              error: null,
            }),
          };
          return query;
        },
        insert: (row: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              const error = dbState.insertErrors.shift() ?? null;
              if (error) return { data: null, error };
              if (dbState.omitReadback) return { data: null, error: null };
              const persisted = { id: `chart-${dbState.inserted.length + 1}`, ...row };
              dbState.inserted.push(persisted);
              return { data: persisted, error: null };
            },
          }),
        }),
        update: (fields: Record<string, unknown>) => ({
          eq: () => ({
            eq: async () => ({ data: null, error: null, fields }),
          }),
        }),
      };
    },
  };
}

const request = (payload: Record<string, unknown>) => new NextRequest('http://localhost/api/jyotish/chart', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload),
});

const input = {
  date_of_birth: '1990-04-12', birth_lat: 23.1765, birth_lng: 75.7885,
  birth_timezone: 'Asia/Kolkata', full_name: 'Synthetic Test',
};

describe('POST /api/jyotish/chart persistence contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbState.inserted = [];
    dbState.insertErrors = [];
    dbState.omitReadback = false;
    generateAstroChart.mockReturnValue(chart);
    deriveDenormalizedBirthProfileFields.mockReturnValue(summary);
    createClient.mockReturnValue(makeDb());
  });

  it('persists a chart for the authenticated owner and returns the exact persisted chart and summary', async () => {
    getApiUser.mockResolvedValue({ user: { id: 'owner-a' }, error: null, supabase: {} });
    const response = await POST(request(input));
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(dbState.inserted).toHaveLength(1);
    expect(dbState.inserted[0]).toMatchObject({ owner_id: 'owner-a', session_token: null, chart_data: chart, ...summary });
    expect(json.profile).toEqual(dbState.inserted[0]);
    expect(json.chart).toEqual(json.profile.chart_data);
    expect(json.profile.owner_id).toBe('owner-a');
  });

  it('a request without an idempotency key never sends that column, so charts still save while the migration is unapplied', async () => {
    getApiUser.mockResolvedValue({ user: { id: 'owner-a' }, error: null, supabase: {} });
    const response = await POST(request(input));
    expect(response.status).toBe(201);
    expect('idempotency_key' in dbState.inserted[0]).toBe(false);
  });

  it('a keyed request stores the key it was given', async () => {
    getApiUser.mockResolvedValue({ user: { id: 'owner-a' }, error: null, supabase: {} });
    const key = '22222222-2222-4222-8222-222222222222';
    const response = await POST(request({ ...input, idempotency_key: key }));
    expect(response.status).toBe(201);
    expect(dbState.inserted[0].idempotency_key).toBe(key);
  });

  it('keeps guest charts session-scoped and refuses an unauthenticated chart without a session token', async () => {
    getApiUser.mockResolvedValue({ user: null, error: new Error('No session'), supabase: null });
    const denied = await POST(request(input));
    expect(denied.status).toBe(401);
    expect(dbState.inserted).toHaveLength(0);

    const guest = await POST(request({ ...input, session_token: 'synthetic-session-1' }));
    const guestJson = await guest.json();
    expect(guest.status).toBe(201);
    expect(guestJson.profile).toMatchObject({ owner_id: null, session_token: 'synthetic-session-1' });
  });

  it('retries a primary-index conflict without claiming the new chart is primary', async () => {
    getApiUser.mockResolvedValue({ user: { id: 'owner-a' }, error: null, supabase: {} });
    dbState.insertErrors = [{ code: '23505', message: 'duplicate key violates idx_birth_profiles_one_primary' }];

    const response = await POST(request({ ...input, is_primary: true }));
    const json = await response.json();
    expect(response.status).toBe(201);
    expect(dbState.inserted).toHaveLength(1);
    expect(json.profile).toMatchObject({ owner_id: 'owner-a', is_primary: false, chart_data: chart });
  });

  it('returns the already-persisted row when the same Native request key is retried', async () => {
    getApiUser.mockResolvedValue({ user: { id: 'owner-a' }, error: null, supabase: {} });
    const payload = { ...input, idempotency_key: '11111111-1111-4111-8111-111111111111' };
    const first = await POST(request(payload));
    const replay = await POST(request(payload));
    const replayJson = await replay.json();

    expect(first.status).toBe(201);
    expect(replay.status).toBe(200);
    expect(replayJson.replayed).toBe(true);
    expect(replayJson.profile).toEqual(dbState.inserted[0]);
    expect(dbState.inserted).toHaveLength(1);
  });

  it('rejects a malformed idempotency key before chart calculation or database writes', async () => {
    getApiUser.mockResolvedValue({ user: { id: 'owner-a' }, error: null, supabase: {} });
    const response = await POST(request({ ...input, idempotency_key: 'not-a-uuid' }));
    expect(response.status).toBe(400);
    expect(generateAstroChart).not.toHaveBeenCalled();
    expect(dbState.inserted).toHaveLength(0);
  });

  it('does not report success when the persisted row is absent', async () => {
    getApiUser.mockResolvedValue({ user: { id: 'owner-a' }, error: null, supabase: {} });
    dbState.omitReadback = true;

    const response = await POST(request(input));
    expect(response.status).toBe(500);
  });
});
