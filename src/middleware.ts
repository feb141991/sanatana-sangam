import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
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
const AUTH_COOKIE_PATTERNS = ['auth-token', 'sb-'] as const;

const PUBLIC_ADMIN_PATHS = [
  '/admin/login',
  '/api/admin/auth',
];

// Always public — landing, auth, marketing, static assets
const ALWAYS_PUBLIC_EXACT = new Set([
  '/',
  '/join',
  '/about',
  '/what-is-shoonaya',
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
  '/auth/',
  '/founding/',
  '/sthapaka/',
  '/sitemap',
  '/robots',
];

export async function middleware(req: NextRequest) {
  try {
    return await middlewareHandler(req);
  } catch (err) {
    // Never let an unhandled throw reach Vercel's edge — it returns 403.
    // Fall through and let the request proceed normally.
    console.error('[middleware] unhandled error:', err);
    return NextResponse.next();
  }
}

function isAuthCookieName(name: string): boolean {
  return AUTH_COOKIE_PATTERNS.some((pattern) => name.includes(pattern));
}

function isInvalidAuthSessionError(error: { message?: string; code?: string; status?: number } | null | undefined): boolean {
  if (!error) return false;
  return (
    error.message?.includes('Refresh Token') ||
    error.message?.includes('refresh_token') ||
    error.code === 'refresh_token_not_found' ||
    error.code === 'user_not_found' ||
    error.status === 400 ||
    error.status === 401 ||
    error.status === 403
  ) ?? false;
}

function clearAuthCookies(req: NextRequest, res: NextResponse): NextResponse {
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

async function getMiddlewareUser(req: NextRequest, res: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  return supabase.auth.getUser();
}

function redirectHome(req: NextRequest, res: NextResponse): NextResponse {
  const homeUrl = req.nextUrl.clone();
  homeUrl.pathname = '/home';
  homeUrl.search = '';
  const redirectResponse = NextResponse.redirect(homeUrl);
  res.cookies.getAll().forEach((cookie) => {
    const { name, value, ...options } = cookie;
    redirectResponse.cookies.set(name, value, options);
  });
  return redirectResponse;
}

async function middlewareHandler(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const envPreviewKey = process.env.PREVIEW_KEY ?? '';
  const res = NextResponse.next();
  const hasAuthCookie = req.cookies.getAll().some((cookie) => isAuthCookieName(cookie.name));
  const {
    data: { user },
    error: authError,
  } = hasAuthCookie
    ? await getMiddlewareUser(req, res)
    : { data: { user: null }, error: null };

  if (isInvalidAuthSessionError(authError)) {
    const landingUrl = req.nextUrl.clone();
    landingUrl.pathname = '/';
    landingUrl.search = '';
    return clearAuthCookies(req, NextResponse.redirect(landingUrl));
  }

  // ── Step 1: ?preview=KEY → set cookie + redirect to clean URL ─────────────
  const previewParam = req.nextUrl.searchParams.get('preview');
  if (previewParam && envPreviewKey && previewParam === envPreviewKey) {
    const cleanUrl = req.nextUrl.clone();
    cleanUrl.searchParams.delete('preview');
    const res = NextResponse.redirect(cleanUrl);
    res.cookies.set(PREVIEW_COOKIE, envPreviewKey, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    return res;
  }

  // ── Step 2: Coming-soon gate ───────────────────────────────────────────────
  const appOpen = process.env.APP_OPEN === 'true';

  if (!appOpen) {
    const isPublic =
      ALWAYS_PUBLIC_EXACT.has(pathname) ||
      ALWAYS_PUBLIC_PREFIX.some(p => pathname.startsWith(p));

    if (!isPublic) {
      // Logged-in users always get through. The gate is for anonymous visitors
      // only, but auth must be confirmed by Supabase instead of cookie presence.
      if (!user) {
        const previewCookie = req.cookies.get(PREVIEW_COOKIE)?.value ?? '';
        const hasPreviewAccess = envPreviewKey
          ? previewCookie === envPreviewKey
          : false;

        if (!hasPreviewAccess) {
          const landingUrl = req.nextUrl.clone();
          landingUrl.pathname = '/';
          landingUrl.search = '';
          return NextResponse.redirect(landingUrl);
        }
      }
    }
  }

  // ── Step 3: Logged-in users at / → go to /home ────────────────────────────
  // Placed AFTER the gate so it only fires when access is already granted.
  if (pathname === '/') {
    if (user) {
      return redirectHome(req, res);
    }
  }

  // ── Step 4: Admin guard (unchanged) ───────────────────────────────────────
  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi  = pathname.startsWith('/api/admin');

  if (!isAdminPage && !isAdminApi) return res;

  if (PUBLIC_ADMIN_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return res;
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

  return res;
}

export const config = {
  matcher: [
    // Match everything except static files — .html excluded to prevent
    // the beforeFiles rewrite (/→/landing.html) from re-triggering middleware
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|html)).*)',
  ],
};
