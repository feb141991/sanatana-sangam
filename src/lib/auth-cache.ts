import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from './supabase-server';

// Single cached Supabase client per request — prevents token-refresh
// divergence when multiple server components create separate clients.
export const getSupabaseClient = cache(async () => {
  return createServerSupabaseClient();
});

export const getAuthUser = cache(async () => {
  try {
    const supabase = await getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      // Invalid/expired refresh token — clear all auth cookies so the
      // middleware stops seeing stale tokens and redirecting to /home.
      // Without this the user gets stuck in a redirect loop.
      if (
        error.message?.includes('Refresh Token') ||
        error.message?.includes('refresh_token') ||
        (error as any).code === 'refresh_token_not_found'
      ) {
        try {
          const cookieStore = await cookies();
          cookieStore.getAll()
            .filter(c => c.name.includes('auth-token') || c.name.includes('sb-'))
            .forEach(c => cookieStore.delete(c.name));
        } catch {
          // cookies() may be read-only in some contexts — ignore
        }
      }
      return null;
    }

    return user ?? null;
  } catch {
    return null;
  }
});
