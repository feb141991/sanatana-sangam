import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from 'node:crypto';

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { classifyApiAuthFailure } from "@/lib/api-auth-status";
import { getPinnedProjectJwksOptions } from '@/lib/api-auth-jwks-config';

// Deliberately untyped (no `<Database>` generic) — matching every other
// working Supabase client factory in this repo (`createClient()` in
// `@/lib/supabase.ts`, `createServerSupabaseClient()` in `@/lib/supabase-server.ts`,
// and the local admin client in `tirtha/place/route.ts`). Passing the
// generated `Database` type explicitly to `createClient<Database>(...)`
// currently makes every `.from(...)` call resolve to `never` on several
// tables under this repo's installed supabase-js version — a pre-existing,
// repo-wide type-generation mismatch unrelated to this route (confirmed by
// reproducing the same `never` errors against already-existing, unrelated
// tables). Left untyped here to stay consistent with the rest of the codebase.
type ApiUser = Pick<User, 'id' | 'email' | 'user_metadata' | 'app_metadata'>;
type ApiUserResult =
  | { user: ApiUser; error: null; supabase: SupabaseClient }
  | { user: null; error: Error; supabase: null };

let claimsVerifier: SupabaseClient | null = null;

/**
 * Reuse one verifier client per server process so supabase-js can cache the
 * project's signing keys. Unlike the per-request RLS client below, this client
 * has no request Authorization header or persisted session.
 */
function getClaimsVerifier(): SupabaseClient {
  if (!claimsVerifier) {
    claimsVerifier = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } },
    );
  }
  return claimsVerifier;
}

// Bound both local JWKS verification (including key refresh) and the web
// cookie getUser() fallback. A timeout is a dependency outage (503), never a
// credential rejection (401).
const AUTH_TIMEOUT_MS = 4_000;

function withAuthTimeout<T>(promise: Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Auth check timed out')), AUTH_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function requestIdFor(req: NextRequest): string {
  const candidate = req.headers.get('x-request-id');
  return candidate && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate)
    ? candidate
    : randomUUID();
}

function getBearerToken(req: NextRequest) {
  const header = req.headers.get("authorization");
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export function getApiAuthFailureResponse(error: unknown, headers?: HeadersInit) {
  const failure = classifyApiAuthFailure(error);
  const responseHeaders = new Headers(headers);
  responseHeaders.set('Cache-Control', 'no-store');
  if (failure.status === 503) responseHeaders.set('Retry-After', '5');
  const requestId = typeof error === 'object' && error !== null && 'requestId' in error &&
    typeof error.requestId === 'string' ? error.requestId : null;
  if (requestId) responseHeaders.set('X-Request-ID', requestId);
  return NextResponse.json({ error: failure.message, code: failure.code, ...(requestId ? { requestId } : {}) }, {
    status: failure.status,
    headers: responseHeaders,
  });
}

function authFailure(req: NextRequest, error: unknown, durationMs: number): ApiUserResult {
  const failure = classifyApiAuthFailure(error);
  const requestId = requestIdFor(req);
  // Never log JWTs, headers, user details or provider error messages.
  console.warn('[api-auth]', {
    path: req.nextUrl.pathname,
    status: failure.status,
    code: failure.code,
    durationMs,
    requestId,
  });
  return {
    user: null,
    error: Object.assign(new Error(failure.message), {
      status: failure.status,
      code: failure.code,
      requestId,
    }),
    supabase: null,
  };
}

/**
 * Resolves the authenticated user for an API route.
 *
 * Bearer path: locally verifies the signed access-token claims with the
 * project's cached signing keys. This avoids a Supabase Auth `/user` request
 * on every native API request. Cookie callers keep the existing fresh
 * `getUser()` validation path.
 *
 * Fallback path: falls through to cookie-based session verification for web callers.
 *
 * Also returns the `supabase` client instance that successfully authenticated
 * — callers should reuse this client for any subsequent table reads/writes
 * instead of standing up a separate service-role admin client. This keeps
 * RLS enforced (least privilege).
 */
export async function getApiUser(req: NextRequest): Promise<ApiUserResult> {
  const token = getBearerToken(req);
  const startedAt = Date.now();

  try {
    // 1. Native callers: validate signature, expiration, issuer, audience and
    // role locally. `getClaims(jwt)` uses the project's JWKS for asymmetric
    // signing keys (ES256 in production), so each API call avoids Auth `/user`.
    if (token) {
      const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!projectUrl) throw new Error('Supabase URL is not configured');
      const jwksOptions = getPinnedProjectJwksOptions(projectUrl);
      const claimsResult = await withAuthTimeout(getClaimsVerifier().auth.getClaims(token, jwksOptions));
      const claims = claimsResult.data?.claims;
      const expectedIssuer = `${projectUrl.replace(/\/$/, '')}/auth/v1`;
      const audience = Array.isArray(claims?.aud) ? claims.aud : [claims?.aud];
      if (
        claims &&
        typeof claims.sub === 'string' && claims.sub.length > 0 &&
        claims.iss === expectedIssuer &&
        audience.includes('authenticated') &&
        claims.role === 'authenticated' &&
        typeof claims.exp === 'number' && Number.isFinite(claims.exp) &&
        claims.exp > Math.floor(Date.now() / 1000) &&
        (claims.nbf === undefined || (typeof claims.nbf === 'number' &&
          Number.isFinite(claims.nbf) && claims.nbf <= Math.floor(Date.now() / 1000)))
      ) {
        // This is the minimal verified identity data our routes consume, not
        // a fetched Auth User record. Local JWT validation cannot observe
        // revocation or user deletion before the token expires.
        const user: ApiUser = {
          id: claims.sub,
          email: typeof claims.email === 'string' ? claims.email : undefined,
          user_metadata: claims.user_metadata ?? {},
          app_metadata: claims.app_metadata ?? {},
        };
        const bearerClient = createClient(
          projectUrl,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
            global: { headers: { Authorization: `Bearer ${token}` } },
          },
        );

        return { user, error: null, supabase: bearerClient };
      }

      const invalidClaims = Object.assign(new Error('Invalid bearer token claims'), { status: 401 });
      return authFailure(req, claimsResult.error ?? invalidClaims, Date.now() - startedAt);
    }

    // 2. Fallback path: Web callers with cookie session, which remains a fresh
    // Auth `/user` lookup because web cookies can be rotated or revoked server-side.
    const cookieClient = await createServerSupabaseClient();
    const cookieResult = await withAuthTimeout(cookieClient.auth.getUser());

    if (cookieResult.data?.user) {
      return { user: cookieResult.data.user, error: null, supabase: cookieClient };
    }

    return authFailure(req, cookieResult.error, Date.now() - startedAt);
  } catch (err: unknown) {
    return authFailure(req, err, Date.now() - startedAt);
  }
}
