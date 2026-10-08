import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

const getApiUser = vi.fn();
vi.mock('@/lib/api-auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api-auth')>(),
  getApiUser: (...args: unknown[]) => getApiUser(...args),
}));
vi.mock('@/lib/api-guards', () => ({ assertNotBanned: async () => null }));

import { GET } from './route';

function createSupabase(result: { data: unknown[] | null; error: Error | null }) {
  const startValues: string[] = [];
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    gte: vi.fn((_column: string, value: string) => {
      startValues.push(value);
      return query;
    }),
    lt: vi.fn(() => query),
    order: vi.fn(async () => result),
  };
  const supabase = { from: vi.fn(() => query) } as unknown as SupabaseClient;
  return { supabase, query, startValues };
}

describe('GET /api/mood/checkin status', () => {
  beforeEach(() => {
    getApiUser.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-02T12:00:00.000Z'));
  });

  afterEach(() => vi.useRealTimers());

  it('returns persisted mood state for the requested spiritual-day window', async () => {
    const { supabase, query } = createSupabase({
      data: [{
        id: 'checkin-1',
        before_mood: 'peaceful',
        clicked_action: null,
        completed_action: null,
        session_status: 'open',
        dismissed: false,
        created_at: '2026-10-02T00:00:00.000Z',
        closed_at: null,
      }],
      error: null,
    });
    getApiUser.mockResolvedValue({ user: { id: 'user-1' }, error: null, supabase });
    const request = new NextRequest('https://shoonaya.com/api/mood/checkin?timezone=Asia%2FKolkata');

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.hasLoggedMoodToday).toBe(true);
    expect(json.lastMood).toBe('peaceful');
    expect(json.openSession.id).toBe('checkin-1');
    expect(json.spiritualDate).toBe('2026-10-02');
    expect(query.gte).toHaveBeenCalledWith('created_at', '2026-10-01T22:30:00.000Z');
    expect(query.lt).toHaveBeenCalledWith('created_at', '2026-10-02T22:30:00.000Z');
  });

  it('preserves the previous UTC-midnight window for existing clients with no timezone parameter', async () => {
    const { supabase, startValues } = createSupabase({ data: [], error: null });
    getApiUser.mockResolvedValue({ user: { id: 'user-1' }, error: null, supabase });
    const request = new NextRequest('https://shoonaya.com/api/mood/checkin');

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.hasLoggedMoodToday).toBe(false);
    expect(json.spiritualDate).toBeDefined();
    expect(startValues).toHaveLength(1);
    const start = new Date(startValues[0]);
    expect(start.toISOString().endsWith('T00:00:00.000Z')).toBe(true);
  });
});
