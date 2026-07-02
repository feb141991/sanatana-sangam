import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// ─── API Guards ───────────────────────────────────────────────────────────────
// Lightweight helpers that protect individual API route handlers.
// These run after authentication so userId is already known.

/**
 * Returns a 403 NextResponse if the user is banned; null if they're clear.
 *
 * Usage:
 *   const banned = await assertNotBanned(supabase, user.id);
 *   if (banned) return banned;
 */
export async function assertNotBanned(
  supabase: SupabaseClient,
  userId: string,
): Promise<NextResponse | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned')
    .eq('id', userId)
    .single();

  if (profile?.is_banned) {
    return NextResponse.json(
      { error: 'Your account has been suspended.' },
      { status: 403 },
    );
  }
  return null;
}

/**
 * Combined auth + ban check in a single roundtrip.
 * Fetches the JWT-verified user AND their ban status in parallel.
 *
 * Returns `{ error }` when auth fails or the user is banned — caller should
 * `return error` immediately. Returns `{ user }` on success.
 *
 * Usage:
 *   const { user, error } = await requireUserNotBanned(supabase);
 *   if (error) return error;
 *   // user is guaranteed non-null here
 */
export async function requireUserNotBanned(
  supabase: SupabaseClient,
): Promise<{ user: User; error: null } | { user: null; error: NextResponse }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.is_banned) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Your account has been suspended.' },
        { status: 403 },
      ),
    };
  }

  return { user, error: null };
}
