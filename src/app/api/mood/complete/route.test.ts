import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const getApiUser = vi.fn();
const updateResult = vi.fn();
vi.mock('@/lib/api-auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api-auth')>(),
  getApiUser: (...args: unknown[]) => getApiUser(...args),
}));
vi.mock('@/lib/api-guards', () => ({ assertNotBanned: async () => null }));

import { POST } from './route';

describe('POST /api/mood/complete', () => {
  beforeEach(() => {
    getApiUser.mockReset();
    updateResult.mockReset();
    updateResult.mockResolvedValue({ data: { id: 'checkin-1' }, error: null });
    const query = {
      eq: vi.fn(() => query),
      select: vi.fn(() => query),
      maybeSingle: () => updateResult(),
    };
    const supabase = {
      from: vi.fn(() => ({ update: vi.fn(() => query) })),
    };
    getApiUser.mockResolvedValue({ user: { id: 'user-1' }, error: null, supabase });
  });

  function request() {
    return new NextRequest('https://shoonaya.com/api/mood/complete', {
      method: 'POST',
      body: JSON.stringify({ checkin_id: 'checkin-1', completed_action: 'mood_only' }),
    });
  }

  it('returns 404 when the check-in does not belong to the user or no longer exists', async () => {
    updateResult.mockResolvedValue({ data: null, error: null });

    const response = await POST(request());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Check-in not found' });
  });

  it('only reports completion when an owned row was actually updated', async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
  });
});
