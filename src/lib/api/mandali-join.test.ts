import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { joinMandaliForLocation } from './mandali';
import { POST } from '@/app/api/mandali/join/route';

const rpc = vi.fn();
vi.mock('@/lib/supabase', () => ({ createClient: () => ({ rpc }) }));
vi.mock('@/lib/api-auth', () => ({ getApiUser: async () => ({ user: { id: 'viewer' }, supabase: { rpc } }) }));
describe('Mandali join entry contracts', () => {
  beforeEach(() => rpc.mockReset());
  it('PWA location joins use one atomic RPC, not a profile update', async () => {
    rpc.mockResolvedValue({ data: { mandaliId: 'existing' }, error: null });
    expect(await joinMandaliForLocation('untrusted-id', ' Tirana ', 'Albania', 41, 19)).toBe('existing');
    expect(rpc).toHaveBeenCalledExactlyOnceWith('join_mandali', { p_mandali_id: null, p_city: 'Tirana', p_country: 'Albania', p_lat: 41, p_lon: 19 });
  });
  it('does not claim success for a missing membership result', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await expect(joinMandaliForLocation('viewer', 'Tirana', 'Albania')).rejects.toThrow('not confirmed');
  });
  it('rejects invalid coordinates instead of silently dropping them', async () => {
    const response = await POST(new NextRequest('https://example.test/api/mandali/join', { method: 'POST', body: JSON.stringify({ mandali_id: 'existing', latitude: 100, longitude: 20 }) }));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('reports a banned join as forbidden, not an internal server failure', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '28000', message: 'Account is suspended' } });
    const response = await POST(new NextRequest('https://example.test/api/mandali/join', { method: 'POST', body: JSON.stringify({ mandali_id: 'existing' }) }));
    expect(response.status).toBe(403);
  });
  it('returns no false success when the RPC result is null', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    const response = await POST(new NextRequest('https://example.test/api/mandali/join', { method: 'POST', body: JSON.stringify({ mandali_id: 'existing' }) }));
    expect(response.status).toBe(502);
  });
});
