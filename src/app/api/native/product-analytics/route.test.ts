import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getApiUser: vi.fn(),
  createAdminClient: vi.fn(),
  checkDurableRateLimit: vi.fn(),
  rejectLargeRequest: vi.fn(),
}));

vi.mock('@/lib/api-auth', () => ({
  getApiUser: mocks.getApiUser,
  getApiAuthFailureResponse: () => new Response('unauthorized', { status: 401 }),
}));
vi.mock('@/lib/supabase-admin', () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock('@/lib/api-security', () => ({
  checkDurableRateLimit: mocks.checkDurableRateLimit,
  clientIp: () => '127.0.0.1',
  rejectLargeRequest: mocks.rejectLargeRequest,
}));

afterEach(() => vi.resetAllMocks());

function request(method: 'POST' | 'DELETE', body?: unknown) {
  return new NextRequest('https://shoonaya.com/api/native/product-analytics', {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

function configure({ accepted = 2, recordError = null, withdrawError = null } = {}) {
  const rpc = vi.fn(async (name: string, args?: Record<string, unknown>) => {
    if (name === 'record_native_product_analytics') return { data: typeof accepted === 'number' ? { accepted, consentRequired: accepted === 0, religiousConsentRequired: false } : accepted, error: recordError, args };
    return { data: 1, error: withdrawError };
  });
  mocks.getApiUser.mockResolvedValue({
    user: { id: 'user-1' },
    error: null,
    supabase: { rpc },
  });
  mocks.createAdminClient.mockReturnValue({});
  mocks.checkDurableRateLimit.mockResolvedValue(null);
  return { rpc };
}

describe('/api/native/product-analytics', () => {
  it('requires a verified signed-in account', async () => {
    mocks.getApiUser.mockResolvedValue({ user: null, error: new Error('unauthorized'), supabase: null });
    const { POST } = await import('./route');
    expect((await POST(request('POST', { events: ['app_opened'] }))).status).toBe(401);
    expect(mocks.checkDurableRateLimit).not.toHaveBeenCalled();
  });

  it('relies on the database RPC to fail closed when consent is off', async () => {
    const { rpc } = configure({ accepted: 0 });
    const { POST } = await import('./route');
    const response = await POST(request('POST', { events: ['app_opened'] }));
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ accepted: 0, consentRequired: true });
    expect(rpc).toHaveBeenCalledWith('record_native_product_analytics', {
      p_events: ['app_opened'], p_app_version: null, p_platform: null,
    });
  });

  it('accepts only allowlisted fields/events, deduplicates per request, and derives owner/date server-side', async () => {
    const { rpc } = configure();
    const { POST } = await import('./route');
    const response = await POST(request('POST', {
      events: ['app_opened', 'app_opened', 'progressive_profiling'],
      appVersion: '1.2.3',
      platform: 'ios',
    }));
    expect(response.status).toBe(202);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc.mock.calls[0]).toEqual(['record_native_product_analytics', {
      p_events: ['app_opened', 'progressive_profiling'], p_app_version: '1.2.3', p_platform: 'ios',
    }]);
  });

  it('rejects extra fields that could carry sensitive or client-attributed data', async () => {
    configure();
    const { POST } = await import('./route');
    for (const extra of [{ route: '/kundali' }, { mood: 'sad' }, { user_id: 'other-user' }, { timestamp: '1999-01-01' }]) {
      expect((await POST(request('POST', { events: ['app_opened'], ...extra }))).status).toBe(400);
    }
  });

  it('rejects malformed optional metadata instead of silently discarding it', async () => {
    configure();
    const { POST } = await import('./route');
    expect((await POST(request('POST', { events: ['app_opened'], appVersion: 'not-a-version' }))).status).toBe(400);
    expect((await POST(request('POST', { events: ['app_opened'], platform: 'web' }))).status).toBe(400);
  });

  it('rejects unknown events and withdraws through the atomic database function', async () => {
    const { POST, DELETE } = await import('./route');
    configure();
    expect((await POST(request('POST', { events: ['mood_logged'] }))).status).toBe(400);
    expect((await POST(request('POST', { events: ['login_started'] }))).status).toBe(400);
    const { rpc } = configure();
    const deleted = await DELETE(request('DELETE'));
    expect(deleted.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('withdraw_native_product_analytics');
  });
});
