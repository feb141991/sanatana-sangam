'use client';

/**
 * AuthSessionGuard — listens for Supabase auth state changes client-side.
 *
 * Catches TOKEN_REFRESH_FAILED and SIGNED_OUT events so stale/invalid
 * sessions are cleared immediately rather than leaving bad cookies that
 * cause the middleware ↔ server redirect loop (visible screen flicker).
 *
 * Mounted once in the root layout. Renders nothing.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function AuthSessionGuard() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'TOKEN_REFRESHED') {
          // Session refreshed successfully — nothing to do
          return;
        }

        if (event === 'SIGNED_OUT') {
          // Session ended — redirect to landing
          router.replace('/');
          return;
        }
      }
    );

    // Also handle refresh token errors by listening to getSession failures
    // This catches the refresh_token_not_found case proactively on mount
    supabase.auth.getSession().then(({ error }) => {
      if (error?.message?.includes('Refresh Token') ||
          error?.message?.includes('refresh_token') ||
          (error as any)?.code === 'refresh_token_not_found') {
        supabase.auth.signOut({ scope: 'local' }).then(() => {
          router.replace('/');
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
