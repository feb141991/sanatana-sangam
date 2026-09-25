import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { getApiUser } from '@/lib/api-auth';
import { generateWithProvider } from '@/lib/ai/providers/inference';

const mocks = vi.hoisted(() => ({
  getApiUser: vi.fn(),
  assertNotBanned: vi.fn().mockResolvedValue(null),
  generateWithProvider: vi.fn(),
}));

vi.mock('@/lib/api-auth', () => ({ getApiUser: mocks.getApiUser }));
vi.mock('@/lib/api-guards', () => ({ assertNotBanned: mocks.assertNotBanned }));
vi.mock('@/lib/ai/providers/inference', () => ({ generateWithProvider: mocks.generateWithProvider }));

function makeSupabase(activityConsent: boolean) {
  const profileSingle = vi.fn().mockResolvedValue({
    data: { tradition: 'sikh', consent_religious_data: true, consent_activity_personalization: activityConsent },
    error: null,
  });
  const profileEq = vi.fn().mockReturnValue({ single: profileSingle });
  const profileSelect = vi.fn().mockReturnValue({ eq: profileEq });
  const sadhanaData = activityConsent
    ? [{ japa_done: false, nitya_done: true, pathshala_done: false, quiz_done: false }]
    : [];
  const sadhanaGte = vi.fn().mockResolvedValue({ data: sadhanaData, error: null });
  const sadhanaEq = vi.fn().mockReturnValue({ gte: sadhanaGte });
  const sadhanaSelect = vi.fn().mockReturnValue({ eq: sadhanaEq });
  const from = vi.fn((table: string) => table === 'profiles'
    ? { select: profileSelect }
    : { select: sadhanaSelect });
  return { from, sadhanaGte };
}

describe('Sankalpa suggestion activity consent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not read practice history without the separate activity consent', async () => {
    const supabase = makeSupabase(false);
    mocks.getApiUser.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null, supabase } as unknown as Awaited<ReturnType<typeof getApiUser>>);
    mocks.generateWithProvider.mockResolvedValueOnce({ text: JSON.stringify(['AI option 1', 'AI option 2', 'AI option 3', 'AI option 4']) });

    const response = await GET(new NextRequest('https://shoonaya.com/api/sankalpa/suggest'));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(supabase.sadhanaGte).not.toHaveBeenCalled();
    expect(payload.suggestions[0]).toBe('AI option 1');
  });

  it('uses a deterministic practice-matched anchor when consented history is available', async () => {
    const supabase = makeSupabase(true);
    mocks.getApiUser.mockResolvedValueOnce({ user: { id: 'user-1' }, error: null, supabase } as unknown as Awaited<ReturnType<typeof getApiUser>>);
    mocks.generateWithProvider.mockResolvedValueOnce({ text: JSON.stringify(['AI option 1', 'AI option 2', 'AI option 3', 'AI option 4']) });

    const response = await GET(new NextRequest('https://shoonaya.com/api/sankalpa/suggest'));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(supabase.sadhanaGte).toHaveBeenCalledOnce();
    expect(payload.suggestions[0]).toBe('I will complete my full nitya karma every morning.');
  });
});
