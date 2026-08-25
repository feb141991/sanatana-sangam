export const WEB_CONSENT_VERSION = '2026-08-24.v1';
export const WEB_CONSENT_STORAGE_KEY = 'shoonaya.web-consent';
export const OPEN_PRIVACY_CHOICES_EVENT = 'shoonaya:open-privacy-choices';

export type WebConsentPreferences = {
  version: typeof WEB_CONSENT_VERSION;
  analytics: boolean;
  advertising: boolean;
  push: boolean;
  decidedAt: string;
};

export function defaultWebConsent(): WebConsentPreferences {
  return {
    version: WEB_CONSENT_VERSION,
    analytics: false,
    advertising: false,
    push: false,
    decidedAt: '',
  };
}

export function parseWebConsent(raw: string | null): WebConsentPreferences | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<WebConsentPreferences>;
    if (value.version !== WEB_CONSENT_VERSION) return null;
    if (typeof value.analytics !== 'boolean' || typeof value.advertising !== 'boolean' || typeof value.push !== 'boolean') return null;
    if (typeof value.decidedAt !== 'string' || !value.decidedAt) return null;
    return { version: WEB_CONSENT_VERSION, analytics: value.analytics, advertising: value.advertising, push: value.push, decidedAt: value.decidedAt };
  } catch {
    return null;
  }
}

export function hasWebConsent(category: 'analytics' | 'advertising' | 'push') {
  if (typeof window === 'undefined') return false;
  try {
    return parseWebConsent(window.localStorage.getItem(WEB_CONSENT_STORAGE_KEY))?.[category] === true;
  } catch {
    return false;
  }
}

export function clearVendorState(previous: WebConsentPreferences, next: WebConsentPreferences) {
  if (typeof window === 'undefined') return;
  if (previous.analytics && !next.analytics) clearKeys(['_ga', '_gid', '_gat']);
  if (previous.advertising && !next.advertising) clearKeys(['__gads', '__gpi', 'google_ama_config']);
  if (previous.push && !next.push) clearStoragePrefixes(['OneSignal', 'onesignal']);
}

function clearKeys(names: string[]) {
  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=.${window.location.hostname}; SameSite=Lax`;
  }
}

function clearStoragePrefixes(prefixes: string[]) {
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key): key is string => Boolean(key));
      for (const key of keys) if (prefixes.some((prefix) => key.toLowerCase().startsWith(prefix.toLowerCase()))) storage.removeItem(key);
    } catch {
      // Storage can be unavailable in private or constrained browser modes.
    }
  }
}
