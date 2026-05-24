// ─── Shoonaya Pro — MVP Activation Flow ──────────────────────────────────────
// Uses DB as authoritative source. Local storage acts only as an optimistic cache
// to prevent UI flicker while the server validates entitlement.

export const PRO_STORAGE_KEY = 'sangam_pro_activated';

export function getIsPro(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(PRO_STORAGE_KEY) === 'true';
}

/** Early-access activation path. Connects to backend but keeps optimistic UI updates. */
export async function activatePro(): Promise<void> {
  // Optimistic update
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PRO_STORAGE_KEY, 'true');
    window.dispatchEvent(new Event('sangam_pro_changed'));
  }

  try {
    const res = await fetch('/api/premium/activate', { method: 'POST' });
    if (!res.ok) {
      throw new Error('Server activation failed');
    }
  } catch (err) {
    // Revert optimistic update on failure
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(PRO_STORAGE_KEY);
      window.dispatchEvent(new Event('sangam_pro_changed'));
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
