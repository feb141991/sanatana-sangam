import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), load: vi.fn() }));
vi.mock('@/lib/api-auth', () => ({ getApiUser: mocks.auth, getApiAuthFailureResponse: (_error: unknown, headers: HeadersInit) => new Response('{}', { status: 401, headers }) }));
vi.mock('@/lib/mandali-data-server', () => ({ loadMandaliNotificationTarget: mocks.load }));
import { GET } from './route';
const ID = '11111111-1111-4111-8111-111111111111';
const request = (query: string) => new NextRequest(`https://example.com/api/mandali/notification-target?${query}`);
beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue({ user: { id: 'verified-viewer' }, error: null }); mocks.load.mockResolvedValue({ kind: 'post', post: { id: ID }, comment: null }); });
describe('notification target route', () => {
  it('uses verified identity and sends private no-store response', async () => {
    const response = await GET(request(`postId=${ID}&userId=attacker`));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(mocks.load).toHaveBeenCalledWith('verified-viewer', { postId: ID });
  });
  it.each(['', 'postId=invalid', `postId=${ID}&requestId=${ID}`, `commentId=${ID}`, `postId=${ID}&postId=${ID}`])('rejects malformed/ambiguous target %s', async (query) => {
    expect((await GET(request(query))).status).toBe(400); expect(mocks.load).not.toHaveBeenCalled();
  });
  it('requires authentication', async () => {
    mocks.auth.mockResolvedValue({ user: null, error: null });
    expect((await GET(request(`postId=${ID}`))).status).toBe(401); expect(mocks.load).not.toHaveBeenCalled();
  });
  it('returns 404 for inaccessible or deleted target', async () => {
    mocks.load.mockResolvedValue(null); expect((await GET(request(`requestId=${ID}`))).status).toBe(404);
  });
  it('returns retryable 503 without database details', async () => {
    mocks.load.mockRejectedValue(new Error('private table detail'));
    const response = await GET(request(`postId=${ID}`));
    expect(response.status).toBe(503); expect(await response.text()).not.toContain('private table detail');
  });
});
