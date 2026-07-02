// ─── Shoonaya Pro — MVP Activation Flow ──────────────────────────────────────
// Uses DB as authoritative source. Local storage acts only as an optimistic cache
// to prevent UI flicker while the server validates entitlement.

export const PRO_STORAGE_KEY = 'sangam_pro_activated';

export function getIsPro(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(PRO_STORAGE_KEY) === 'true';
}

/** Early-access activation path. Optimistic UI + server persistence. */
export async function activatePro(): Promise<void> {
  // Optimistic update
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PRO_STORAGE_KEY, 'true');
    window.dispatchEvent(new Event('sangam_pro_changed'));
  }

  try {
    const res = await fetch('/api/premium/activate', { method: 'POST' });

    if (res.status === 409) {
      // Feature flag disabled in this environment — revert optimistic update.
      // This is expected in production; do not throw an error users will see.
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(PRO_STORAGE_KEY);
        window.dispatchEvent(new Event('sangam_pro_changed'));
      }
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error ?? 'Early-access activation is not available.');
    }

    if (!res.ok) {
      throw new Error('Server activation failed');
    }

    // ok: true — server confirmed. Optimistic state already correct.
  } catch (err) {
    // Revert optimistic update on any non-409 failure
    if (err instanceof Error && !err.message.includes('not available')) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(PRO_STORAGE_KEY);
        window.dispatchEvent(new Event('sangam_pro_changed'));
      }
    }
    console.error('[premium] Activation failed:', err);
    throw err;
  }
}

export function deactivatePro(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PRO_STORAGE_KEY);
  window.dispatchEvent(new Event('sangam_pro_changed'));
}
