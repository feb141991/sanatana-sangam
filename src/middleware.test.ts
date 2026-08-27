import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware, shouldVerifyUserInMiddleware } from './middleware';

describe('middleware authentication scope', () => {
  it('returns Home immediately even when an auth cookie is present', async () => {
    const request = new NextRequest('https://www.shoonaya.com/home', {
      headers: {
        cookie: 'sb-test-auth-token=stale-or-slow-session',
      },
    });
    const startedAt = performance.now();

    const response = await middleware(request);

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(performance.now() - startedAt).toBeLessThan(250);
  });

  it('does not perform remote auth for Home when the app is open', () => {
    expect(shouldVerifyUserInMiddleware({
      pathname: '/home',
      appOpen: true,
      isPublicPath: false,
    })).toBe(false);
  });

  it('does not perform remote auth for public API or admin routing', () => {
    expect(shouldVerifyUserInMiddleware({
      pathname: '/api/calendar/upcoming',
      appOpen: true,
      isPublicPath: true,
    })).toBe(false);
    expect(shouldVerifyUserInMiddleware({
      pathname: '/admin/users',
      appOpen: true,
      isPublicPath: true,
    })).toBe(false);
  });

  it('verifies users only for root redirects and a closed private gate', () => {
    expect(shouldVerifyUserInMiddleware({
      pathname: '/',
      appOpen: true,
      isPublicPath: true,
    })).toBe(true);
    expect(shouldVerifyUserInMiddleware({
      pathname: '/home',
      appOpen: false,
      isPublicPath: false,
    })).toBe(true);
  });

  it('does not verify public paths when the preview gate is closed', () => {
    expect(shouldVerifyUserInMiddleware({
      pathname: '/privacy',
      appOpen: false,
      isPublicPath: true,
    })).toBe(false);
  });
});
