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

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';

// Hard navigation ensures browser sends the next request with no stale cookies,
// breaking the middleware ↔ client redirect loop.
function redirectToLanding() {
  window.location.replace('/');
}

export default function AuthSessionGuard() {
  // Prevent double-redirect when both SIGNED_OUT event and getSession() error
  // fire at the same time (e.g. on expired refresh token).
  const redirecting = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    const isPublicAuthPath =
      pathname === '/login' ||
      pathname === '/signup' ||
      pathname === '/forgot-password' ||
      pathname === '/reset-password' ||
      pathname === '/confirm-email' ||
      pathname.startsWith('/auth/');
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (isPublicAuthPath) return;
        if (event === 'SIGNED_OUT') {
          if (redirecting.current) return;
          redirecting.current = true;
          redirectToLanding();
        }
      }
    );

    // Proactively check for bad refresh tokens on mount.
    // Only fires once; ref guard prevents racing with the SIGNED_OUT event above.
    supabase.auth.getSession().then(({ error }) => {
      if (isPublicAuthPath) return;
      if (!error) return;
      const msg = error.message ?? '';
      const isTokenError =
        msg.includes('Refresh Token') ||
        msg.includes('refresh_token') ||
        (error as any)?.code === 'refresh_token_not_found';
      if (!isTokenError) return;
      if (redirecting.current) return;
      redirecting.current = true;
      supabase.auth.signOut({ scope: 'local' }).finally(redirectToLanding);
    });

    return () => subscription.unsubscribe();
  }, [pathname]);

  return null;
}
