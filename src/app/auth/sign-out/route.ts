import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE_PATTERNS = ['auth-token', 'sb-'] as const;

function isAuthCookieName(name: string): boolean {
  return AUTH_COOKIE_PATTERNS.some((pattern) => name.includes(pattern));
}

export function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  const reason = req.nextUrl.searchParams.get('reason') || 'signed_out';
  url.pathname = '/login';
  url.search = `?reason=${encodeURIComponent(reason)}`;

  const res = NextResponse.redirect(url);
  req.cookies.getAll()
    .filter((cookie) => isAuthCookieName(cookie.name))
    .forEach((cookie) => {
      res.cookies.set(cookie.name, '', {
        path: '/',
        maxAge: 0,
      });
    });

  return res;
}
