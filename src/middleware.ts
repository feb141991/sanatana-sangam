import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE } from '@/lib/admin-auth';

const PUBLIC_ADMIN_PATHS = [
  '/admin/login',
  '/api/admin/auth',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard admin routes
  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi  = pathname.startsWith('/api/admin');
  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  // Allow public admin paths (login page, auth endpoint)
  if (PUBLIC_ADMIN_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Verify cookie — wrap in try/catch so a missing ADMIN_SECRET env var
  // doesn't crash the middleware; it just redirects to login.
  const token = req.cookies.get(ADMIN_COOKIE)?.value ?? '';
  let session: { username: string } | null = null;
  try {
    session = await verifyAdminToken(token);
  } catch {
    session = null;
  }

  if (!session) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.search = '';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
