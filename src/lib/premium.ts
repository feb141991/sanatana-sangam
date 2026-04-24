// ─── Sangam Pro — Premium State ───────────────────────────────────────────────
// localStorage gives instant reactivity across all usePremium() hooks.
// The DB column (profiles.is_pro) persists across devices / browser clears.
// activatePro() writes both; the server is source of truth on page load.

export const PRO_STORAGE_KEY = 'sangam_pro_activated';

export function getIsPro(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(PRO_STORAGE_KEY) === 'true';
}

/** Set localStorage + fire reactive event — no server call. Used for server→client hydration. */
export function activateProLocally(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PRO_STORAGE_KEY, 'true');
  window.dispatchEvent(new Event('sangam_pro_changed'));
}

/** Full activation: persists to DB, then syncs localStorage so all hooks react instantly. */
export async function activatePro(): Promise<void> {
  // Optimistic: local state fires immediately so UI responds without waiting for the server
  activateProLocally();
  try {
    await fetch('/api/premium/activate', { method: 'POST' });
  } catch {
    // Network error — local state is already set so UX is unaffected.
    // DB will be out of sync until next login, but that's acceptable for now.
    console.warn('[premium] Server activation failed — local state set anyway');
  }
}

export function deactivatePro(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PRO_STORAGE_KEY);
  window.dispatchEvent(new Event('sangam_pro_changed'));
}
