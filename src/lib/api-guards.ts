import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

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
