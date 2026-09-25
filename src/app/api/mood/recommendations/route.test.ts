import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { getApiUser } from '@/lib/api-auth';

const mocks = vi.hoisted(() => ({
  getApiUser: vi.fn(),
  assertNotBanned: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/api-auth', () => ({ getApiUser: mocks.getApiUser }));
vi.mock('@/lib/api-guards', () => ({ assertNotBanned: mocks.assertNotBanned }));

function makeSupabase(consented: boolean, checkins: Array<Record<string, unknown>>) {
  const historyLimit = vi.fn().mockResolvedValue({ data: checkins, error: null });
  const historyOrder = vi.fn().mockReturnValue({ limit: historyLimit });
  const historyEq = vi.fn().mockReturnValue({ order: historyOrder });
  const historySelect = vi.fn().mockReturnValue({ eq: historyEq });
  const profileMaybeSingle = vi.fn().mockResolvedValue({
    data: { consent_activity_personalization: consented },
    error: null,
  });
  const profileEq = vi.fn().mockReturnValue({ maybeSingle: profileMaybeSingle });
  const profileSelect = vi.fn().mockReturnValue({ eq: profileEq });
  const from = vi.fn((table: string) => table === 'profiles'
    ? { select: profileSelect }
    : { select: historySelect });
  return { from, historyLimit };
}

describe('mood recommendation activity-consent gate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not fetch mood history when activity personalization is not opted in', async () => {
    const supabase = makeSupabase(false, [{ completed_action: 'pathshala' }]);
    mocks.getApiUser.mockResolvedValueOnce({
      user: { id: 'user-1' }, error: null, supabase,
    } as unknown as Awaited<ReturnType<typeof getApiUser>>);

    const response = await GET(new NextRequest('https://shoonaya.com/api/mood/recommendations?mood=grateful&full=true'));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(supabase.historyLimit).not.toHaveBeenCalled();
    expect(payload.recommendations[0].type).toBe('stotram');
  });

  it('uses completed practice history only after explicit activity consent', async () => {
    const supabase = makeSupabase(true, [{ completed_action: 'pathshala', clicked_action: null, skipped_actions: [] }]);
    mocks.getApiUser.mockResolvedValueOnce({
      user: { id: 'user-1' }, error: null, supabase,
    } as unknown as Awaited<ReturnType<typeof getApiUser>>);

    const response = await GET(new NextRequest('https://shoonaya.com/api/mood/recommendations?mood=grateful&full=true'));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(supabase.historyLimit).toHaveBeenCalledOnce();
    expect(payload.recommendations[0].type).toBe('pathshala');
  });
});
