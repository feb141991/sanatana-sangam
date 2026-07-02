'use client';

import { useEffect } from 'react';
import {
  isOneSignalConfigured,
  loginToOneSignal,
  syncOneSignalContext,
  logoutFromOneSignal,
} from '@/lib/onesignal';

export function OneSignalIdentityProvider({
  userId,
  tradition,
  city,
  countryCode,
  wantsFestivalReminders,
  wantsShlokaReminders,
  wantsNityaReminders,
  wantsCommunityNotifications,
  wantsFamilyNotifications,
}: {
  userId?: string | null;
  tradition?: string | null;
  city?: string | null;
  countryCode?: string | null;
  wantsFestivalReminders?: boolean;
  wantsShlokaReminders?: boolean;
  wantsNityaReminders?: boolean;
  wantsCommunityNotifications?: boolean;
  wantsFamilyNotifications?: boolean;
}) {
  useEffect(() => {
    const configured = isOneSignalConfigured();
    if (!configured) return;

    let cancelled = false;

    const handleError = (error: unknown) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[OneSignalIdentityProvider] Identity sync failed:', error);
      }
    };

    if (!userId) {
      void logoutFromOneSignal().catch(handleError);
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      await loginToOneSignal(userId);
      if (cancelled) return;

      await syncOneSignalContext({
        tradition,
        city,
        countryCode,
        wantsFestivalReminders,
        wantsShlokaReminders,
        wantsNityaReminders,
        wantsCommunityNotifications,
        wantsFamilyNotifications,
      });
    })().catch(handleError);

    return () => {
      cancelled = true;
    };
  }, [
    userId,
    tradition,
    city,
    countryCode,
    wantsFestivalReminders,
    wantsShlokaReminders,
    wantsNityaReminders,
    wantsCommunityNotifications,
    wantsFamilyNotifications,
  ]);

  // Render nothing, it's a logic provider
  return null;
}
