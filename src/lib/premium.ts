// ─── Sangam Pro — Premium State ───────────────────────────────────────────────
// Stored in localStorage for now (no payment gateway yet).
// When payment is integrated, this will sync with a DB column (e.g. profiles.is_pro).

export const PRO_STORAGE_KEY = 'sangam_pro_activated';

export function getIsPro(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(PRO_STORAGE_KEY) === 'true';
}

export function activatePro(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PRO_STORAGE_KEY, 'true');
  // Dispatch a custom event so all usePremium hooks re-render immediately
  window.dispatchEvent(new Event('sangam_pro_changed'));
}

export function deactivatePro(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PRO_STORAGE_KEY);
  window.dispatchEvent(new Event('sangam_pro_changed'));
}
