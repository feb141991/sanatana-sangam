'use client';

/**
 * Client-side helpers for recording versioned Terms/Privacy acceptance.
 * The email-signup flow can call recordLegalAcceptance directly (a session
 * already exists). The Google/Apple OAuth flow redirects away before a
 * session exists, so it stashes intent via markPendingLegalAcceptance and
 * AuthSessionGuard consumes it once the user lands back with a session.
 */

import { createClient } from '@/lib/supabase';

const PENDING_KEY = 'shoonaya_pending_legal_acceptance';

export async function recordLegalAcceptance(document: 'terms' | 'privacy', surface: string): Promise<void> {
  try {
    await fetch('/api/user/legal-acceptance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document, surface }),
    });
  } catch {
    // Best-effort -- a failed receipt write should never block signup.
  }
}

export function markPendingLegalAcceptance(surface: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(PENDING_KEY, surface);
  } catch {
    // Ignore storage failures (private browsing, quota, etc).
  }
}

export async function consumePendingLegalAcceptance(): Promise<void> {
  if (typeof window === 'undefined') return;
  let surface: string | null = null;
  try {
    surface = window.sessionStorage.getItem(PENDING_KEY);
  } catch {
    return;
  }
  if (!surface) return;

  // Only clear the flag once a real session exists to attach the receipt
  // to -- otherwise a check that fires before the OAuth redirect completes
  // (or before email confirmation) would discard the pending acceptance
  // without ever recording it.
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;

  try {
    window.sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Ignore
  }
  await Promise.all([
    recordLegalAcceptance('terms', surface),
    recordLegalAcceptance('privacy', surface),
  ]);
}
