import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  bearerGetUser: vi.fn(),
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

import { getApiUser } from './api-auth';

describe('getApiUser auth failure contract', () => {
  beforeEach(() => {
    mocks.bearerGetUser.mockReset();
    mocks.cookieGetUser.mockReset();
    mocks.createClient.mockReset();
    mocks.createServerSupabaseClient.mockReset();
    mocks.createClient.mockReturnValue({ auth: { getUser: mocks.bearerGetUser } });
    mocks.createServerSupabaseClient.mockResolvedValue({ auth: { getUser: mocks.cookieGetUser } });
  });

  it('keeps an invalid bearer as 401 and never falls through to cookie auth', async () => {
    mocks.bearerGetUser.mockResolvedValue({
      data: { user: null },
      error: { status: 401, name: 'AuthApiError' },
    });

    const result = await getApiUser(new NextRequest('http://localhost/api/example', {
      headers: { Authorization: 'Bearer invalid-token' },
    }));

    expect(result.user).toBeNull();
    expect(result.error).toMatchObject({ status: 401, code: 'AUTH_REQUIRED' });
    expect(mocks.createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it('preserves a returned auth dependency failure as 503', async () => {
    mocks.bearerGetUser.mockResolvedValue({
      data: { user: null },
      error: { status: 503, name: 'AuthRetryableFetchError' },
    });

    const result = await getApiUser(new NextRequest('http://localhost/api/example', {
      headers: { Authorization: 'Bearer temporarily-unverifiable' },
    }));

    expect(result.error).toMatchObject({ status: 503, code: 'AUTH_UNAVAILABLE' });
    expect(result.error?.message).toBe('Authentication temporarily unavailable');
  });

  it('classifies a thrown auth transport failure as 503 without exposing its message', async () => {
    mocks.bearerGetUser.mockRejectedValue(new Error('sensitive provider transport detail'));

    const result = await getApiUser(new NextRequest('http://localhost/api/example', {
      headers: { Authorization: 'Bearer token' },
    }));

    expect(result.error).toMatchObject({ status: 503, code: 'AUTH_UNAVAILABLE' });
    expect(result.error?.message).not.toContain('sensitive');
  });
});
