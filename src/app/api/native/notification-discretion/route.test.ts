import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { auth, read, select, filter } = vi.hoisted(() => ({
  auth: vi.fn(), read: vi.fn(), select: vi.fn(), filter: vi.fn(),
}));
vi.mock('@/lib/api-auth', () => ({
  getApiUser: auth,
  getApiAuthFailureResponse: () => NextResponse.json({ error: 'Sign in required' }, { status: 401 }),
}));

import { GET } from './route';

const request = () => new NextRequest('https://www.shoonaya.com/api/native/notification-discretion?userId=someone-else');

describe('GET notification discretion', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.mockResolvedValue({ user: { id: 'signed-in' }, supabase: { from: () => ({ select }) } });
    select.mockReturnValue({ eq: filter });
    filter.mockReturnValue({ maybeSingle: read });
  });

  it.each([true, false])('returns the authenticated account’s setting when it is %s', async (enabled) => {
    read.mockResolvedValue({ data: { notification_discreet_mode: enabled }, error: null });
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(filter).toHaveBeenCalledWith('id', 'signed-in');
    expect(select).toHaveBeenCalledWith('notification_discreet_mode');
    expect(await response.json()).toEqual({ enabled });
  });

  it('rejects anonymous reads before querying profiles', async () => {
    auth.mockResolvedValue({ user: null, supabase: null });
    expect((await GET(request())).status).toBe(401);
    expect(read).not.toHaveBeenCalled();
  });

  it.each([
    { data: null, error: { code: '42703', message: 'database details' } },
    { data: null, error: null },
    { data: { notification_discreet_mode: null }, error: null },
  ])('reports an unavailable preference without guessing or exposing database details', async (row) => {
    read.mockResolvedValue(row);
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ code: 'NOTIFICATION_DISCRETION_UNAVAILABLE' });
  });
});
