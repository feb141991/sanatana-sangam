// ─── Shoonaya Pro — Early-access client state only ───────────────────────────
// This local flag exists only so the current preview shell reacts immediately.
// Production billing must not rely on localStorage. Server-side entitlement
// truth is being introduced separately.

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

/** Early-access activation path. Do not use as production billing flow. */
export async function activatePro(): Promise<void> {
  // Optimistic: local state fires immediately so UI responds without waiting for the server
  activateProLocally();
  try {
    await fetch('/api/premium/activate', { method: 'POST' });
  } catch {
    console.warn('[premium] Early-access activation failed on server; local preview state remains set');
  }
}

export function deactivatePro(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PRO_STORAGE_KEY);
  window.dispatchEvent(new Event('sangam_pro_changed'));
}
