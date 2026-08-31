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
import { consumePendingLegalAcceptance } from '@/lib/legal-acceptance';

function hasErrorCode(error: unknown, code: string): boolean {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === code;
}

// Hard navigation ensures browser sends the next request with no stale cookies.
function redirectToLogin(reason = 'session_expired') {
  window.location.replace(`/login?reason=${encodeURIComponent(reason)}`);
}

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
      pathname.startsWith('/auth/') ||
      // Admin uses a separate HMAC-cookie session (no Supabase auth.users row).
      // Without this guard, SIGNED_OUT events from a previously-expired user
      // session redirect the admin to '/' as soon as they land on any /admin page.
      pathname.startsWith('/admin');
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
    void supabase.auth.getSession()
      .then(({ error }) => {
        if (isPublicAuthPath) return;
        if (!error) return;
        const msg = error.message ?? '';
        const isTokenError =
          msg.includes('Refresh Token') ||
          msg.includes('refresh_token') ||
          hasErrorCode(error, 'refresh_token_not_found');
        if (!isTokenError) return;
        if (redirecting.current) return;
        redirecting.current = true;
        void supabase.auth.signOut({ scope: 'local' })
          .finally(() => redirectToLogin('session_expired'));
      })
      .catch((error: unknown) => {
        // A transient browser storage/lock failure must not crash the app.
        // Authenticated server layouts remain the source of truth for access.
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[AuthSessionGuard] Session check unavailable:', error);
        }
      });

    return () => subscription.unsubscribe();
  }, [pathname]);

  // Records a Terms/Privacy acceptance stashed by the signup page before an
  // OAuth redirect (or an unconfirmed-email redirect), once a real session
  // exists to attach it to. No-ops if nothing is pending. See
  // src/lib/legal-acceptance.ts.
  useEffect(() => {
    void consumePendingLegalAcceptance();
  }, [pathname]);

  return null;
}
