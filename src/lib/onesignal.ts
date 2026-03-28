// ─── OneSignal Push Notifications ─────────────────────────────────
// Free tier: unlimited web push notifications
// Setup: https://onesignal.com → Create App → Web Push → Copy App ID
// SDK URL and App ID are configured in @/lib/config.ts → API.ONESIGNAL

import { API } from '@/lib/config';

export const ONESIGNAL_APP_ID = API.ONESIGNAL.APP_ID;

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
        appId:                 ONESIGNAL_APP_ID,
        notifyButton:          { enable: false },   // we use custom bell
        allowLocalhostAsSecureOrigin: true,         // for dev
      });
    });
  };
  document.head.appendChild(script);
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const OneSignal = (window as any).OneSignal;
  if (!OneSignal) return false;
  try {
    await OneSignal.Notifications.requestPermission();
    return OneSignal.Notifications.permission;
  } catch {
    return false;
  }
}

/** Returns the OneSignal push subscription player ID, or null if unavailable */
export async function getPlayerId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const OneSignal = (window as any).OneSignal;
  if (!OneSignal) return null;
  try {
    return (await OneSignal.User?.PushSubscription?.id) ?? null;
  } catch {
    return null;
  }
}

/** Returns current push permission state: 'default' | 'granted' | 'denied' */
export function getPermissionState(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
  return Notification.permission;
}
