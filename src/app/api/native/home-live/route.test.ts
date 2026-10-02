import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

const getApiUser = vi.fn();
vi.mock('@/lib/api-auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api-auth')>(),
  getApiUser: (...args: unknown[]) => getApiUser(...args),
}));

import { GET } from './route';

function createSupabase(result: { data: unknown[] | null; error: Error | null }) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    gte: vi.fn(() => query),
    lt: vi.fn(() => query),
    order: vi.fn(async () => result),
  };
  const supabase = { from: vi.fn(() => query) } as unknown as SupabaseClient;
  return { supabase, query };
}

describe('GET /api/native/home-live mood status', () => {
  beforeEach(() => getApiUser.mockReset());

  it('returns spiritual-day mood and dismissal status using the requested timezone', async () => {
    const { supabase, query } = createSupabase({
      data: [{
        id: 'checkin-1',
        before_mood: 'grateful',
        clicked_action: null,
        completed_action: null,
        session_status: 'dismissed',
        dismissed: true,
        created_at: '2026-10-02T00:00:00.000Z',
        closed_at: '2026-10-02T00:00:00.000Z',
      }],
      error: null,
    });
    getApiUser.mockResolvedValue({ user: { id: 'user-1' }, error: null, supabase });
    const request = new NextRequest('https://shoonaya.com/api/native/home-live?fields=moodStatus&timezone=Asia%2FKolkata');

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.moodStatus).toEqual({
      hasLoggedMoodToday: true,
      lastMood: 'grateful',
      hasDismissedToday: true,
      spiritualDate: '2026-10-02',
    });
    expect(query.gte).toHaveBeenCalledWith('created_at', '2026-10-01T22:30:00.000Z');
    expect(query.lt).toHaveBeenCalledWith('created_at', '2026-10-02T22:30:00.000Z');
  });

  it('omits mood status when the database read fails instead of claiming no mood was logged', async () => {
    const { supabase } = createSupabase({ data: null, error: new Error('database unavailable') });
    getApiUser.mockResolvedValue({ user: { id: 'user-1' }, error: null, supabase });
    const request = new NextRequest('https://shoonaya.com/api/native/home-live?fields=moodStatus&timezone=Asia%2FKolkata');

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).not.toHaveProperty('moodStatus');
  });
});
