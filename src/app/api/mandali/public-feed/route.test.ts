import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const loader = vi.hoisted(() => ({ fn: vi.fn(), CursorError: class PublicFeedCursorError extends Error {} }));
vi.mock('@/lib/mandali-public-feed', () => ({
  loadPublicMandaliFeedPage: (...args: unknown[]) => loader.fn(...args),
  PublicFeedCursorError: loader.CursorError,
}));
const getApiUser = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api-auth', () => ({ getApiUser: (...args: unknown[]) => getApiUser(...args) }));

import { GET } from './route';

let ip = 0;
const request = (query = '') => new NextRequest(`https://shoonaya.com/api/mandali/public-feed${query}`, { headers: { 'x-forwarded-for': `10.0.0.${++ip}` } });

describe('GET /api/mandali/public-feed', () => {
  beforeEach(() => {
    loader.fn.mockReset();
    getApiUser.mockReset();
    loader.fn.mockResolvedValue({ schemaVersion: 1, posts: [], nextCursor: null });
  });

  it('answers without an account, never reads one, and may be cached briefly', async () => {
    const response = await GET(request('?limit=5&cursor=abc'));
    expect(response.status).toBe(200);
    expect(getApiUser).not.toHaveBeenCalled();
    expect(loader.fn).toHaveBeenCalledWith({ cursor: 'abc', limit: 5 });
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=30');
  });

  it('ignores a limit that is not a number', async () => {
    await GET(request('?limit=many'));
    expect(loader.fn).toHaveBeenCalledWith({ cursor: null, limit: undefined });
  });

  it('answers 400 for a bad cursor and 500 for a failure, without the database text, and caches neither', async () => {
    loader.fn.mockRejectedValueOnce(new loader.CursorError());
    const bad = await GET(request('?cursor=zz'));
    expect(bad.status).toBe(400);
    expect(bad.headers.get('Cache-Control')).toBe('no-store');

    loader.fn.mockRejectedValueOnce(new Error('relation "posts" timeout at column author_id'));
    const failed = await GET(request());
    expect(failed.status).toBe(500);
    expect(JSON.stringify(await failed.json())).not.toMatch(/relation|author_id|timeout/);
    expect(failed.headers.get('Cache-Control')).toBe('no-store');
  });

  it('limits one address to 60 requests a minute', async () => {
    const same = () => new NextRequest('https://shoonaya.com/api/mandali/public-feed', { headers: { 'x-forwarded-for': '10.9.9.9' } });
    let last = 200;
    for (let i = 0; i < 61; i++) last = (await GET(same())).status;
    expect(last).toBe(429);
  });
});
