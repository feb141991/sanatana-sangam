import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/admin-auth";

// ─── Preview / Coming-Soon Gate ───────────────────────────────────────────────
//
// APP_OPEN=false           → app is restricted. Only preview-cookie holders enter.
// APP_OPEN unset/true      → launched/live app. Gate removed.
//
// Grant testing access by sharing:
//   https://www.shoonaya.com/?preview=<PREVIEW_KEY>
//   (set PREVIEW_KEY in Vercel environment variables)
//
// Cookie lasts 30 days. Recipient can use the app normally once set.
// ─────────────────────────────────────────────────────────────────────────────

const PREVIEW_COOKIE = "shoonaya_preview";
const AUTH_COOKIE_PATTERNS = ["auth-token", "sb-"] as const;
const AUTH_LOOKUP_TIMEOUT_MS = 2_500;

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/api/admin/auth"];

// Always public — landing, auth, marketing, static assets
const ALWAYS_PUBLIC_EXACT = new Set([
  "/",
  "/join",
  "/about",
  "/what-is-shoonaya",
  "/contact",
  "/privacy",
  "/terms",
  "/guidelines",
  "/banned",
  "/data-deletion",
  "/pricing",
  "/features",
  "/traditions",
  "/community",
  "/sources",
  "/payment",
  "/login",
  "/signup",
  "/whatsapp-login",
  "/forgot-password",
  "/reset-password",
  "/confirm-email",
  "/offline",
]);

const ALWAYS_PUBLIC_PREFIX = [
  "/api/",
  "/admin",
  "/_next/",
  "/icons/",
  "/assets/",
  "/fonts/",
  "/blessing/",
  "/name/",
  "/discover/",
  "/invite/",
  "/auth/",
  "/founding/",
  "/sthapaka/",
  "/features/",
  "/traditions/",
  "/beta/",
  "/sitemap",
  "/robots",
];

// Request correlation ID. Generated once per request, here, so every log
// line and response this request touches -- middleware, getApiUser's
// authFailure (src/lib/api-auth.ts, which already reads this exact header
// and falls back to generating its own if absent), route handlers, any
// future log drain -- can be tied back to the same request. Without this,
// "a 401 followed by a 200" was a pattern to investigate, not proof it was
// the same request (see the auth observability review this fixes).
// UUID v4, matching api-auth.ts's requestIdFor() validation regex exactly.
//
// Deliberately ALWAYS generated fresh here, never read from an incoming
// x-request-id -- unlike api-auth.ts's own requestIdFor(), which trusts an
// existing valid one. That asymmetry is intentional, not an inconsistency:
// middleware is the first server-side code this request reaches, so it's
// the right place to establish "a new id starts here," rather than let a
// client (or anyone curling the API directly) choose the id that ends up
// in server logs -- a client could otherwise reuse the same id across many
// requests and make log correlation useless, or spoof an id to make an
// unrelated request appear to match one from a bug report. api-auth.ts's
// fallback exists for robustness (never crash if middleware didn't run,
// e.g. a direct function invocation in a test), not to honor client input.
function generateRequestId(): string {
  return crypto.randomUUID();
}

export async function middleware(req: NextRequest) {
  const requestId = generateRequestId();
  let response: NextResponse;
  try {
    response = await middlewareHandler(req, requestId);
  } catch (err) {
    // Never let an unhandled throw reach Vercel's edge — it returns 403.
    // Fall through and let the request proceed normally.
    console.error("[middleware] unhandled error:", { requestId, err });
    response = NextResponse.next();
  }
  // Set on every exit path (redirects, JSON errors, pass-through) from one
  // place, rather than touching each of middlewareHandler's several return
  // points individually.
  response.headers.set("x-request-id", requestId);
  return response;
}

function isAuthCookieName(name: string): boolean {
  return AUTH_COOKIE_PATTERNS.some((pattern) => name.includes(pattern));
}

function isInvalidAuthSessionError(
  error:
    { message?: string; code?: string; status?: number } | null | undefined,
): boolean {
  if (!error) return false;
  return (
    (error.message?.includes("Refresh Token") ||
      error.message?.includes("refresh_token") ||
      error.code === "refresh_token_not_found" ||
      error.code === "user_not_found" ||
      error.status === 400 ||
      error.status === 401 ||
      error.status === 403) ??
    false
  );
}

function clearAuthCookies(req: NextRequest, res: NextResponse): NextResponse {
  req.cookies
    .getAll()
    .filter((cookie) => isAuthCookieName(cookie.name))
    .forEach((cookie) => {
      res.cookies.set(cookie.name, "", {
        path: "/",
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
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  return supabase.auth.getUser();
}

export function shouldVerifyUserInMiddleware({
  pathname,
  appOpen,
  isPublicPath,
}: {
  pathname: string;
  appOpen: boolean;
  isPublicPath: boolean;
}): boolean {
  // Authentication for application pages belongs to their server/client auth
  // guards. Middleware only needs a verified user for these routing decisions.
  return !appOpen && !isPublicPath;
}

async function getMiddlewareUserWithTimeout(
  req: NextRequest,
  res: NextResponse,
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<{
    data: { user: null };
    error: null;
  }>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(
        "[middleware] Supabase user lookup timed out; using anonymous routing fallback",
      );
      resolve({ data: { user: null }, error: null });
    }, AUTH_LOOKUP_TIMEOUT_MS);
  });

  try {
    return await Promise.race([getMiddlewareUser(req, res), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function middlewareHandler(req: NextRequest, requestId: string) {
  const { pathname } = req.nextUrl;
  const envPreviewKey = process.env.PREVIEW_KEY ?? "";
  // Forwarded as a REQUEST header (not just set on the response below) so
  // the route handler that actually runs next -- e.g. getApiUser in
  // src/lib/api-auth.ts -- sees req.headers.get('x-request-id') already
  // populated, instead of falling back to generating its own separate id.
  const forwardedHeaders = new Headers(req.headers);
  forwardedHeaders.set("x-request-id", requestId);
  const res = NextResponse.next({ request: { headers: forwardedHeaders } });

  // OAuth callback requests must reach the route handler even when the browser
  // carries stale Supabase cookies. Otherwise middleware clears the stale cookie
  // and redirects to `/`, discarding the fresh `code` before it can be exchanged.
  const isOAuthExchangeRequest =
    pathname === "/auth/callback" ||
    (pathname === "/" && req.nextUrl.searchParams.has("code"));

  if (isOAuthExchangeRequest) {
    return res;
  }

  // ── Step 1: ?preview=KEY → set cookie + redirect to clean URL ─────────────
  const previewParam = req.nextUrl.searchParams.get("preview");
  if (previewParam && envPreviewKey && previewParam === envPreviewKey) {
    const cleanUrl = req.nextUrl.clone();
    cleanUrl.searchParams.delete("preview");
    const res = NextResponse.redirect(cleanUrl);
    res.cookies.set(PREVIEW_COOKIE, envPreviewKey, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  }

  // ── Step 2: Coming-soon gate ───────────────────────────────────────────────
  const appOpen = process.env.APP_OPEN !== "false";
  const isPublicPath =
    ALWAYS_PUBLIC_EXACT.has(pathname) ||
    ALWAYS_PUBLIC_PREFIX.some((prefix) => pathname.startsWith(prefix));
  const hasAuthCookie = req.cookies
    .getAll()
    .some((cookie) => isAuthCookieName(cookie.name));
  const shouldVerifyUser =
    hasAuthCookie &&
    shouldVerifyUserInMiddleware({
      pathname,
      appOpen,
      isPublicPath,
    });
  const {
    data: { user },
    error: authError,
  } = shouldVerifyUser
    ? await getMiddlewareUserWithTimeout(req, res)
    : { data: { user: null }, error: null };

  if (isInvalidAuthSessionError(authError)) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "?reason=session_expired";
    return clearAuthCookies(req, NextResponse.redirect(loginUrl));
  }

  if (!appOpen) {
    if (!isPublicPath) {
      // Logged-in users always get through. The gate is for anonymous visitors
      // only, but auth must be confirmed by Supabase instead of cookie presence.
      if (!user) {
        const previewCookie = req.cookies.get(PREVIEW_COOKIE)?.value ?? "";
        const hasPreviewAccess = envPreviewKey
          ? previewCookie === envPreviewKey
          : false;

        if (!hasPreviewAccess) {
          const landingUrl = req.nextUrl.clone();
          landingUrl.pathname = "/";
          landingUrl.search = "";
          return NextResponse.redirect(landingUrl);
        }
      }
    }
  }

  // ── Step 3: Admin guard (unchanged) ───────────────────────────────────────
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) return res;

  if (
    PUBLIC_ADMIN_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/"),
    )
  ) {
    return res;
  }

  const token = req.cookies.get(ADMIN_COOKIE)?.value ?? "";
  let session: { username: string } | null = null;
  try {
    session = await verifyAdminToken(token);
  } catch {
    session = null;
  }

  if (!session) {
    if (isAdminApi) {
      return NextResponse.json(
        { error: "Admin authentication required" },
        { status: 401 },
      );
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: [
    // Match everything except static files — .html excluded to prevent
    // the beforeFiles rewrite (/→/landing.html) from re-triggering middleware
    "/((?!.well-known/workflow/|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|html)).*)",
  ],
};
