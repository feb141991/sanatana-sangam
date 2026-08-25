import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase-server";

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

function getBearerToken(req: NextRequest) {
  const header = req.headers.get("authorization");
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
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

    const bearerResult = await bearerClient.auth.getUser(token);
    if (bearerResult.data?.user) {
      return { user: bearerResult.data.user, error: null, supabase: bearerClient };
    }

    return {
      user: null,
      error: bearerResult.error ?? new Error("Unauthorized"),
      supabase: null,
    };
  }

  // 2. Fallback path: Web callers with cookie session
  try {
    const cookieClient = await createServerSupabaseClient();
    const cookieResult = await cookieClient.auth.getUser();

    if (cookieResult.data?.user) {
      return { user: cookieResult.data.user, error: null, supabase: cookieClient };
    }

    return {
      user: null,
      error: cookieResult.error ?? new Error("Unauthorized"),
      supabase: null,
    };
  } catch (err: any) {
    return {
      user: null,
      error: err instanceof Error ? err : new Error("Unauthorized"),
      supabase: null,
    };
  }
}
