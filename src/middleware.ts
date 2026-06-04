import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE } from '@/lib/admin-auth';

// ─── Preview / Coming-Soon Gate ───────────────────────────────────────────────
//
// APP_OPEN=false (default) → app is restricted. Only preview-cookie holders enter.
// APP_OPEN=true            → set in Vercel on June 17 launch day. Gate removed.
//
// Grant testing access by sharing:
//   https://shoonaya.com/?preview=<PREVIEW_KEY>
//   (set PREVIEW_KEY in Vercel environment variables)
//
// Cookie lasts 30 days. Recipient can use the app normally once set.
// ─────────────────────────────────────────────────────────────────────────────

const PREVIEW_COOKIE = 'shoonaya_preview';

const PUBLIC_ADMIN_PATHS = [
  '/admin/login',
  '/api/admin/auth',
];

// These paths are always public — no gate
const ALWAYS_PUBLIC_EXACT = new Set([
  '/',
  '/join',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/guidelines',
  '/banned',
  '/data-deletion',
  '/pricing',
  '/payment',
]);

const ALWAYS_PUBLIC_PREFIX = [
  '/api/',
  '/admin',
  '/_next/',
  '/icons/',
  '/assets/',
  '/fonts/',
  '/blessing/',
  '/name/',
  '/discover/',
  '/invite/',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const envPreviewKey = process.env.PREVIEW_KEY ?? '';

  // ── Step 0: Logged-in users hitting / go straight to /home ────────────────
  // (must run before the rewrite in next.config.js serves landing.html)
  if (pathname === '/') {
    // Only do a quick cookie check here — full session validation is heavy in edge.
    // The app cookie set by Supabase is named 'sb-*-auth-token'.
    const hasSbCookie = [...req.cookies.getAll()].some(c => c.name.includes('-auth-token') && c.value.length > 10);
    if (hasSbCookie) {
      const homeUrl = req.nextUrl.clone();
      homeUrl.pathname = '/home';
      homeUrl.search = '';
      return NextResponse.redirect(homeUrl);
    }
  }

  // ── Step 1: ?preview=KEY in URL → set cookie + redirect to clean URL ───────
  const previewParam = req.nextUrl.searchParams.get('preview');
  if (previewParam && envPreviewKey && previewParam === envPreviewKey) {
    const cleanUrl = req.nextUrl.clone();
    cleanUrl.searchParams.delete('preview');
    const res = NextResponse.redirect(cleanUrl);
    res.cookies.set(PREVIEW_COOKIE, envPreviewKey, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
    return res;
  }

  // ── Step 2: Coming-soon gate ────────────────────────────────────────────────
  const appOpen = process.env.APP_OPEN === 'true';

  if (!appOpen) {
    const isPublic =
      ALWAYS_PUBLIC_EXACT.has(pathname) ||
      ALWAYS_PUBLIC_PREFIX.some(p => pathname.startsWith(p));

    if (!isPublic) {
      const previewCookie = req.cookies.get(PREVIEW_COOKIE)?.value ?? '';
      const hasAccess = envPreviewKey
        ? previewCookie === envPreviewKey
        : false; // no PREVIEW_KEY set = nobody gets in (except APP_OPEN=true)

      if (!hasAccess) {
        const landingUrl = req.nextUrl.clone();
        landingUrl.pathname = '/';
        landingUrl.search = '';
        return NextResponse.redirect(landingUrl);
      }
    }
  }

  // ── Step 3: Admin guard (unchanged) ────────────────────────────────────────
  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi  = pathname.startsWith('/api/admin');

  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  if (PUBLIC_ADMIN_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

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
  matcher: [
    // Match everything except static assets
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)).*)',
  ],
};
