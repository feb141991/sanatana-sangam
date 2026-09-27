import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), admin: vi.fn(), repair: vi.fn(), loadComments: vi.fn() }));
vi.mock('@/lib/api-auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/api-auth')>(), getApiUser: mocks.auth,
}));
vi.mock('@/lib/admin', () => ({ createServiceRoleSupabaseClient: mocks.admin }));
vi.mock('@/lib/supabase-admin', () => ({ createAdminClient: mocks.admin }));
vi.mock('@/lib/auth-profile', () => ({ ensureAuthProfile: mocks.repair }));
vi.mock('@/lib/api-security', () => ({ rejectLargeRequest: () => null, rateLimitByIp: () => null }));
vi.mock('@/lib/mandali-data-server', () => ({ loadPostComments: mocks.loadComments, loadSingleComment: vi.fn() }));

import { POST as completeJapa } from '@/app/api/japa/complete/route';
import { POST as clearNotifications } from '@/app/api/notifications/clear/route';
import { POST as bootstrapProfile } from '@/app/api/native/profile/bootstrap/route';
import { GET as getComments, POST as addComment, PATCH as editComment, DELETE as deleteComment } from '@/app/api/mandali/comments/route';

const routes = [
  ['japa/complete', 'POST', completeJapa],
  ['notifications/clear', 'POST', clearNotifications],
  ['native/profile/bootstrap', 'POST', bootstrapProfile],
  ['mandali/comments', 'GET', getComments],
  ['mandali/comments', 'POST', addComment],
  ['mandali/comments', 'PATCH', editComment],
  ['mandali/comments', 'DELETE', deleteComment],
] as const;

beforeEach(() => { vi.clearAllMocks(); });

describe.each(routes)('%s %s auth boundary', (path, method, handler) => {
  it.each([401, 503])('returns the actual auth failure %s before any reads, writes or profile repair', async (status) => {
    const requestId = 'a1b2c3d4-e5f6-4789-8123-456789abcdef';
    mocks.auth.mockResolvedValue({ user: null, supabase: null,
      error: Object.assign(new Error('provider detail must remain private'), { status, requestId }) });
    const req = new NextRequest(`http://localhost/api/${path}?postId=fixture`, { method });
    const parseBody = vi.spyOn(req, 'json');
    const response = await handler(req);
    expect(response.status).toBe(status);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('retry-after')).toBe(status === 503 ? '5' : null);
    expect(response.headers.get('x-request-id')).toBe(requestId);
    expect(await response.json()).toEqual({
      code: status === 503 ? 'AUTH_UNAVAILABLE' : 'AUTH_REQUIRED',
      error: status === 503 ? 'Authentication temporarily unavailable' : 'Unauthorized', requestId,
    });
    expect(parseBody).not.toHaveBeenCalled();
    expect(mocks.admin).not.toHaveBeenCalled();
    expect(mocks.repair).not.toHaveBeenCalled();
    expect(mocks.loadComments).not.toHaveBeenCalled();
  });
});

describe('success paths remain authenticated and scoped', () => {
  it('completes japa under the authenticated RLS client and retains validation', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { saved: true }, error: null });
    mocks.auth.mockResolvedValue({ user: { id: 'user-1' }, error: null, supabase: { rpc } });
    const invalid = await completeJapa(new NextRequest('http://localhost/api/japa/complete', { method: 'POST', body: '{}' }));
    expect(invalid.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
    const valid = await completeJapa(new NextRequest('http://localhost/api/japa/complete', { method: 'POST', body: JSON.stringify({
      clientCompletionId: 'idempotent-id', mantra: 'fixture', count: 108, rounds: 1, durationSeconds: 90,
    }) }));
    expect(valid.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('complete_japa_session', expect.objectContaining({ p_client_completion_id: 'idempotent-id' }));
  });

  it('clears only the authenticated notification owner', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'user-1' }, error: null });
    const eq = vi.fn().mockResolvedValue({ count: 3, error: null });
    mocks.admin.mockReturnValue({ from: () => ({ delete: () => ({ eq }) }) });
    const response = await clearNotifications(new NextRequest('http://localhost/api/notifications/clear', { method: 'POST' }));
    expect(response.status).toBe(200);
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(await response.json()).toEqual({ cleared: 3 });
  });

  it('repairs the authenticated profile and preserves a genuine repair-unavailable response', async () => {
    const user = { id: 'user-1' };
    mocks.auth.mockResolvedValue({ user, error: null });
    mocks.repair.mockResolvedValueOnce({ onboarding_completed: true }).mockResolvedValueOnce(null);
    const req = () => new NextRequest('http://localhost/api/native/profile/bootstrap', { method: 'POST' });
    const response = await bootstrapProfile(req());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ onboarding_completed: true });
    expect(mocks.repair).toHaveBeenCalledWith(user);
    const failed = await bootstrapProfile(req());
    expect(failed.status).toBe(503);
    expect(await failed.json()).toEqual({ error: 'Could not initialise account profile' });
  });
});
