import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ verifyAdminCookieAuth: vi.fn(), requireAdminAccess: vi.fn(), createAdminClient: vi.fn() }));
vi.mock('@/lib/admin-auth', () => ({ verifyAdminCookieAuth: mocks.verifyAdminCookieAuth }));
vi.mock('@/lib/admin', () => ({ requireAdminAccess: mocks.requireAdminAccess }));
vi.mock('@/lib/supabase-admin', () => ({ createAdminClient: mocks.createAdminClient }));

import { GET } from './route';

afterEach(() => vi.resetAllMocks());

const request = (url = 'https://shoonaya.com/api/admin/native-product-analytics') => new NextRequest(url);

describe('GET /api/admin/native-product-analytics', () => {
  it('requires both admin authentication checks before querying the aggregate', async () => {
    mocks.verifyAdminCookieAuth.mockResolvedValue(new Response('unauthorized', { status: 401 }));
    expect((await GET(request())).status).toBe(401);
    expect(mocks.requireAdminAccess).not.toHaveBeenCalled();
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it('returns only the database-suppressed aggregate with a bounded window', async () => {
    mocks.verifyAdminCookieAuth.mockResolvedValue(null);
    mocks.requireAdminAccess.mockResolvedValue({ user: { id: 'admin' } });
    const rpc = vi.fn().mockResolvedValue({ data: [{ event_name: 'app_opened', event_date: '2026-10-10', opted_in_accounts: 22 }], error: null });
    mocks.createAdminClient.mockReturnValue({ rpc });
    const response = await GET(request('https://shoonaya.com/api/admin/native-product-analytics?days=14'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toMatchObject({ days: 14, suppressedBelow: 20, rows: [{ opted_in_accounts: 22 }] });
    expect(rpc).toHaveBeenCalledWith('get_native_product_analytics_summary', { p_days: 14 });
  });

  it('rejects invalid windows and handles unavailable aggregate data safely', async () => {
    mocks.verifyAdminCookieAuth.mockResolvedValue(null);
    mocks.requireAdminAccess.mockResolvedValue({ user: { id: 'admin' } });
    expect((await GET(request('https://shoonaya.com/api/admin/native-product-analytics?days=365'))).status).toBe(400);
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'private' } });
    mocks.createAdminClient.mockReturnValue({ rpc });
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Product analytics summary is unavailable' });
  });
});
