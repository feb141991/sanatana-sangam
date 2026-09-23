import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { classifyApiAuthFailure } from "@/lib/api-auth-status";

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
type ApiUserResult =
  | { user: User; error: null; supabase: SupabaseClient }
  | { user: null; error: Error; supabase: null };

// Reliability plan item 7: getApiUser is the auth entry point for nearly
// every route in this app and previously had no timeout at all on either
// auth.getUser() call -- a slow/hanging auth-provider network round trip
// would hang the whole request rather than failing fast. Matches the
// DB_TIMEOUT convention already used in /api/native/progress-summary. A
// timeout here throws a plain Error with no .status/.name/.code, which
// classifyApiAuthFailure's default branch correctly reads as
// AUTH_UNAVAILABLE (503, retryable) rather than AUTH_REQUIRED (401) --
// a slow dependency is not evidence of bad credentials.
const AUTH_TIMEOUT_MS = 4_000;

function withAuthTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Auth check timed out')), AUTH_TIMEOUT_MS);
    }),
  ]);
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
  return NextResponse.json({ error: failure.message, code: failure.code }, {
    status: failure.status,
    headers: responseHeaders,
  });
}

function authFailure(req: NextRequest, error: unknown): ApiUserResult {
  const failure = classifyApiAuthFailure(error);
  // Never log JWTs, headers, user details or provider error messages.
  console.warn('[api-auth]', { path: req.nextUrl.pathname, status: failure.status, code: failure.code });
  return {
    user: null,
    error: Object.assign(new Error(failure.message), { status: failure.status, code: failure.code }),
    supabase: null,
  };
}

/**
 * Resolves the authenticated user for an API route.
 *
 * Fast path: checks for a Bearer token FIRST (native callers via `apiFetch`),
 * avoiding an expensive cookie-session network lookup that is guaranteed to fail
 * for native clients.
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

  try {

  // 1. Fast path: Native callers with Bearer token
  if (token) {
    const bearerClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      }
    );

    const bearerResult = await withAuthTimeout(bearerClient.auth.getUser(token));
    if (bearerResult.data?.user) {
      return { user: bearerResult.data.user, error: null, supabase: bearerClient };
    }

    return authFailure(req, bearerResult.error);
  }

  // 2. Fallback path: Web callers with cookie session
    const cookieClient = await createServerSupabaseClient();
    const cookieResult = await withAuthTimeout(cookieClient.auth.getUser());

    if (cookieResult.data?.user) {
      return { user: cookieResult.data.user, error: null, supabase: cookieClient };
    }

    return authFailure(req, cookieResult.error);
  } catch (err: unknown) {
    return authFailure(req, err);
  }
}
