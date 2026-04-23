// ─── OneSignal Push Notifications ─────────────────────────────────
// Free tier: unlimited web push notifications
// Setup: https://onesignal.com → Create App → Web Push → Copy App ID
// SDK URL and App ID are configured in @/lib/config.ts → API.ONESIGNAL

import { API } from '@/lib/config';

export const ONESIGNAL_APP_ID = API.ONESIGNAL.APP_ID;

// ─── IMPORTANT: always push through OneSignalDeferred ────────────────────────
// window.OneSignal is set when the <script> loads, but OneSignal.init() is async.
// Calling OneSignal.login() or Notifications.requestPermission() before init()
// completes silently fails — the user's push token is never linked.
// OneSignalDeferred callbacks fire only AFTER init() resolves, so always use it.
const ONESIGNAL_TIMEOUT_MS = 8000; // 8s — generous for slow mobile connections

function withOneSignal<T>(callback: (OneSignal: any) => Promise<T> | T): Promise<T | null> {
  if (typeof window === 'undefined' || !ONESIGNAL_APP_ID) return Promise.resolve(null);

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      console.warn('[OneSignal] Timed out waiting for SDK init');
      resolve(null);
    }, ONESIGNAL_TIMEOUT_MS);

    // Always use OneSignalDeferred — never fast-path via window.OneSignal.
    // The deferred queue only fires callbacks after init() has completed.
    (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
    (window as any).OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        window.clearTimeout(timeout);
        resolve(await callback(OneSignal));
      } catch (err) {
        console.warn('[OneSignal] Callback error:', err);
        window.clearTimeout(timeout);
        resolve(null);
      }
    });
  });
}

export function isOneSignalConfigured() {
  return Boolean(ONESIGNAL_APP_ID);
}

export function initOneSignal() {
  if (typeof window === 'undefined' || !ONESIGNAL_APP_ID) return;

  // Load OneSignal SDK
  const script    = document.createElement('script');
  script.src      = API.ONESIGNAL.SDK_URL;
  script.defer    = true;
  script.onload   = () => {
    (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
    (window as any).OneSignalDeferred.push(async (OneSignal: any) => {
      await OneSignal.init({
        appId:                       ONESIGNAL_APP_ID,
        notifyButton:                { enable: false },  // we use custom bell
        allowLocalhostAsSecureOrigin: true,              // for dev
        // Safari on iOS 16.4+ requires an explicit service worker scope.
        // Without this the SDK silently fails to register its worker on iOS PWAs.
        serviceWorkerParam:          { scope: '/' },
      });
    });
  };
  document.head.appendChild(script);
}

export async function requestNotificationPermission(): Promise<boolean> {
  const result = await withOneSignal(async (OneSignal) => {
    await OneSignal.Notifications.requestPermission();
    return OneSignal.Notifications.permission === true || OneSignal.Notifications.permission === 'granted';
  });

  return Boolean(result);
}

/** Returns the OneSignal push subscription player ID, or null if unavailable */
export async function getPlayerId(): Promise<string | null> {
  const id = await withOneSignal(async (OneSignal) =>
    OneSignal.User?.PushSubscription?.id ?? null
  );
  return id ?? null;
}

export async function loginToOneSignal(externalId: string) {
  if (!externalId) return;
  await withOneSignal(async (OneSignal) => {
    await OneSignal.login(externalId);
  });
}

type OneSignalContext = {
  tradition?: string | null;
  city?: string | null;
  countryCode?: string | null;
  wantsFestivalReminders?: boolean;
  wantsShlokaReminders?: boolean;
  wantsCommunityNotifications?: boolean;
  wantsFamilyNotifications?: boolean;
};

export async function syncOneSignalContext(context: OneSignalContext) {
  await withOneSignal(async (OneSignal) => {
    const tags = {
      tradition: context.tradition || '',
      city: context.city || '',
      country_code: context.countryCode || '',
      wants_festival_reminders: context.wantsFestivalReminders ? '1' : '0',
      wants_shloka_reminders: context.wantsShlokaReminders ? '1' : '0',
      wants_community_notifications: context.wantsCommunityNotifications ? '1' : '0',
      wants_family_notifications: context.wantsFamilyNotifications ? '1' : '0',
    };

    if (typeof OneSignal.User?.addTags === 'function') {
      await OneSignal.User.addTags(tags);
      return;
    }

    if (typeof OneSignal.User?.addTag === 'function') {
      await Promise.all(
        Object.entries(tags).map(([key, value]) => OneSignal.User.addTag(key, value))
      );
    }
  });
}

export async function logoutFromOneSignal() {
  await withOneSignal(async (OneSignal) => {
    await OneSignal.logout();
  });
}

/** Returns current push permission state: 'default' | 'granted' | 'denied' */
export function getPermissionState(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
  return Notification.permission;
}
