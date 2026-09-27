import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  bearerGetUser: vi.fn(),
  bearerGetClaims: vi.fn(),
  cookieGetUser: vi.fn(),
  createClient: vi.fn(),
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => mocks.createClient(...args),
}));

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: (...args: unknown[]) => mocks.createServerSupabaseClient(...args),
}));

import { getApiAuthFailureResponse, getApiUser } from './api-auth';

describe('getApiUser auth failure contract', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://mnbwodcswxoojndytngu.supabase.co');
    mocks.bearerGetUser.mockReset();
    mocks.bearerGetClaims.mockReset();
    mocks.cookieGetUser.mockReset();
    mocks.createClient.mockReset();
    mocks.createServerSupabaseClient.mockReset();
    mocks.createClient.mockReturnValue({ auth: { getUser: mocks.bearerGetUser, getClaims: mocks.bearerGetClaims } });
    mocks.createServerSupabaseClient.mockResolvedValue({ auth: { getUser: mocks.cookieGetUser } });
  });

  it('keeps an invalid bearer as 401 and never falls through to cookie auth', async () => {
    mocks.bearerGetClaims.mockResolvedValue({
      data: null,
      error: { status: 401, name: 'AuthApiError' },
    });

    const result = await getApiUser(new NextRequest('http://localhost/api/example', {
      headers: { Authorization: 'Bearer invalid-token' },
    }));

    expect(result.user).toBeNull();
    expect(result.error).toMatchObject({ status: 401, code: 'AUTH_REQUIRED' });
    expect(mocks.bearerGetUser).not.toHaveBeenCalled();
    expect(mocks.createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it('preserves a returned auth dependency failure as 503', async () => {
    mocks.bearerGetClaims.mockResolvedValue({
      data: null,
      error: { status: 503, name: 'AuthRetryableFetchError' },
    });

    const result = await getApiUser(new NextRequest('http://localhost/api/example', {
      headers: { Authorization: 'Bearer temporarily-unverifiable' },
    }));

    expect(result.error).toMatchObject({ status: 503, code: 'AUTH_UNAVAILABLE' });
    expect(result.error?.message).toBe('Authentication temporarily unavailable');
  });

  it('uses one request id in auth logs and the retryable response', async () => {
    const requestId = 'a1b2c3d4-e5f6-4789-8123-456789abcdef';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.bearerGetClaims.mockRejectedValue(new Error('provider transport detail'));

    const result = await getApiUser(new NextRequest('http://localhost/api/example', {
      headers: { Authorization: 'Bearer token', 'X-Request-ID': requestId },
    }));
    const response = getApiAuthFailureResponse(result.error);
    const body = await response.json();

    expect(result.error).toMatchObject({ status: 503, code: 'AUTH_UNAVAILABLE', requestId });
    expect(warn).toHaveBeenCalledWith('[api-auth]', expect.objectContaining({
      path: '/api/example', status: 503, code: 'AUTH_UNAVAILABLE', requestId,
    }));
    expect(response.status).toBe(503);
    expect(response.headers.get('x-request-id')).toBe(requestId);
    expect(body.requestId).toBe(requestId);
    expect(body.error).not.toContain('provider transport detail');
    warn.mockRestore();
  });

  it('clears the auth timeout timer when claim verification responds promptly', async () => {
    vi.useFakeTimers();
    try {
      mocks.bearerGetClaims.mockResolvedValue({
        data: { claims: validClaims({ sub: 'user-1' }) }, error: null,
      });
      const result = await getApiUser(new NextRequest('http://localhost/api/example', {
        headers: { Authorization: 'Bearer valid-token' },
      }));

      expect(result.user?.id).toBe('user-1');
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('classifies a thrown signing-key transport failure as 503 without exposing its message', async () => {
    mocks.bearerGetClaims.mockRejectedValue(new Error('sensitive signing-key transport detail'));

    const result = await getApiUser(new NextRequest('http://localhost/api/example', {
      headers: { Authorization: 'Bearer token' },
    }));

    expect(result.error).toMatchObject({ status: 503, code: 'AUTH_UNAVAILABLE' });
    expect(result.error?.message).not.toContain('sensitive');
  });

  it('times out a hanging bearer claim verification as 503 rather than hanging the request', async () => {
    vi.useFakeTimers();
    try {
      mocks.bearerGetClaims.mockReturnValue(new Promise(() => {}));

      const resultPromise = getApiUser(new NextRequest('http://localhost/api/example', {
        headers: { Authorization: 'Bearer slow-token' },
      }));

      await vi.advanceTimersByTimeAsync(4_000);
      const result = await resultPromise;

      expect(result.user).toBeNull();
      expect(result.error).toMatchObject({ status: 503, code: 'AUTH_UNAVAILABLE' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('accepts only signed claims for this project and authenticated users', async () => {
    mocks.bearerGetClaims.mockResolvedValue({ data: { claims: validClaims({ sub: 'user-42' }) }, error: null });
    const result = await getApiUser(new NextRequest('http://localhost/api/example', {
      headers: { Authorization: 'Bearer valid-token' },
    }));

    expect(result.user).toMatchObject({ id: 'user-42', email: 'devotee@example.com' });
    expect(mocks.bearerGetUser).not.toHaveBeenCalled();
  });

  it.each([
    ['wrong issuer', { iss: 'https://attacker.example/auth/v1' }],
    ['wrong audience', { aud: 'anon' }],
    ['wrong role', { role: 'service_role' }],
    ['missing subject', { sub: '' }],
  ])('rejects verified claims with %s', async (_label, override) => {
    mocks.bearerGetClaims.mockResolvedValue({ data: { claims: validClaims(override) }, error: null });
    const result = await getApiUser(new NextRequest('http://localhost/api/example', {
      headers: { Authorization: 'Bearer signed-token' },
    }));

    expect(result.user).toBeNull();
    expect(result.error).toMatchObject({ status: 401, code: 'AUTH_REQUIRED' });
  });

  it('times out a hanging cookie auth.getUser() call as 503 rather than hanging the request (reliability plan item 7)', async () => {
    vi.useFakeTimers();
    try {
      mocks.cookieGetUser.mockReturnValue(new Promise(() => {}));

      const resultPromise = getApiUser(new NextRequest('http://localhost/api/example'));

      await vi.advanceTimersByTimeAsync(4_000);
      const result = await resultPromise;

      expect(result.user).toBeNull();
      expect(result.error).toMatchObject({ status: 503, code: 'AUTH_UNAVAILABLE' });
    } finally {
      vi.useRealTimers();
    }
  });
});

function validClaims(overrides: Record<string, unknown> = {}) {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://mnbwodcswxoojndytngu.supabase.co';
  return {
    sub: 'user-default',
    iss: `${projectUrl.replace(/\/$/, '')}/auth/v1`,
    aud: ['authenticated'],
    role: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600,
    email: 'devotee@example.com',
    user_metadata: { full_name: 'Devotee' },
    app_metadata: {},
    ...overrides,
  };
}
