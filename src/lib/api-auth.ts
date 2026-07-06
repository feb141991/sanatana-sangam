import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase-server';

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
  const header = req.headers.get('authorization');
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

/**
 * Resolves the authenticated user for an API route, trying a cookie-based
 * session first (web callers) and falling back to a Bearer token (native
 * callers via `apiFetch`).
 *
 * Also returns the `supabase` client instance that successfully authenticated
 * — callers should reuse this client for any subsequent table reads/writes
 * instead of standing up a separate service-role admin client. This keeps
 * RLS enforced (least privilege) and avoids a `never`-typed admin client
 * (see Slice 4D report: `createAdminClient()` intersecting certain tables
 * produced `never` row types under this repo's current supabase-js/Database
 * type generation — reusing the already-working cookie/bearer client sidesteps
 * that entirely).
 */
export async function getApiUser(req: NextRequest): Promise<ApiUserResult> {
  const cookieClient = await createServerSupabaseClient();
  const cookieResult = await cookieClient.auth.getUser();

  if (cookieResult.data.user) {
    return { user: cookieResult.data.user, error: null, supabase: cookieClient };
  }

  const token = getBearerToken(req);
  if (!token) {
    return {
      user: null,
      error: cookieResult.error ?? new Error('Unauthorized'),
      supabase: null,
    };
  }

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
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const bearerResult = await bearerClient.auth.getUser();
  if (!bearerResult.data.user) {
    return {
      user: null,
      error: bearerResult.error ?? new Error('Unauthorized'),
      supabase: null,
    };
  }

  return { user: bearerResult.data.user, error: null, supabase: bearerClient };
}
