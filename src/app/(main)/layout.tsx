import { redirect } from 'next/navigation';
import { getAuthUser, getSupabaseClient } from '@/lib/auth-cache';
import { createAdminClient } from '@/lib/supabase-admin';
import BottomNav from '@/components/layout/BottomNav';
import AIChatFABWrapper from '@/components/layout/AIChatFABWrapper';
import { TraditionSync } from '@/components/providers/TraditionSync';
import { LocationProvider } from '@/lib/LocationContext';
import { EngineProvider } from '@/contexts/EngineContext';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import type { AppLang } from '@/lib/i18n/translations';
import type { User } from '@supabase/supabase-js';
import { OneSignalIdentityProvider } from '@/components/providers/OneSignalIdentityProvider';

function profileName(user: User) {
  const meta = user.user_metadata ?? {};
  const name = typeof meta.full_name === 'string' ? meta.full_name
    : typeof meta.name === 'string' ? meta.name
    : user.email?.split('@')[0];
  return name?.trim() || 'Shoonaya Seeker';
}

function profileUsername(user: User) {
  const meta = user.user_metadata ?? {};
  const raw = typeof meta.username === 'string' ? meta.username
    : user.email?.split('@')[0];
  const base = raw
    ?.toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24);
  return `${base || 'seeker'}_${user.id.slice(0, 8)}`;
}

async function repairMissingProfile(user: User) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  const admin = createAdminClient() as any;
  const insertProfile = {
    id: user.id,
    full_name: profileName(user),
    username: profileUsername(user),
    avatar_url: typeof user.user_metadata?.avatar_url === 'string'
      ? user.user_metadata.avatar_url
      : null,
    app_language: 'en',
    tradition: null,
    onboarding_completed: false,
  };

  const { error } = await admin
    .from('profiles')
    .upsert(insertProfile, { onConflict: 'id' });

  if (error) {
    console.error('[main-layout] profile repair failed:', {
      userId: user.id.slice(0, 8),
      code: error.code,
      message: error.message,
    });
    return null;
  }

  return {
    latitude: null,
    longitude: null,
    city: null,
    country: null,
    country_code: null,
    tradition: null,
    full_name: insertProfile.full_name,
    username: insertProfile.username,
    app_language: insertProfile.app_language,
    is_banned: false,
    wants_festival_reminders: true,
    wants_shloka_reminders: true,
    wants_nitya_reminders: true,
    wants_community_notifications: true,
    wants_family_notifications: true,
  };
}

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  const userId = user?.id ?? '';
  // Reuse the same cached client — prevents token-refresh divergence
  const supabase = await getSupabaseClient();

  let savedLat:         number | null = null;
  let savedLon:         number | null = null;
  let savedCity:        string        = '';
  let savedCountry:     string        = '';
  let savedCountryCode: string        = '';
  let userName:         string        = 'Sadhak';
  let tradition:        string        = 'hindu';
  let appLanguage: AppLang            = 'en';

  // Notification preferences
  let wantsFestivalReminders = true;
  let wantsShlokaReminders = true;
  let wantsNityaReminders = true;
  let wantsCommunityNotifications = true;
  let wantsFamilyNotifications = true;

  if (user) {
    let { data: profile } = await supabase
      .from('profiles')
      .select('latitude, longitude, city, country, country_code, tradition, full_name, username, app_language, is_banned, wants_festival_reminders, wants_shloka_reminders, wants_nitya_reminders, wants_community_notifications, wants_family_notifications')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      profile = await repairMissingProfile(user);
      if (!profile) {
        redirect('/auth/sign-out?reason=missing_profile');
      }
    }

    // Enforce suspension
    if (profile.is_banned) {
      redirect('/banned');
    }

    // NOTE: onboarding redirect intentionally removed from layout.
    // The layout wraps /onboarding itself — redirecting here caused an
    // infinite loop (layout → redirect /onboarding → layout → repeat).
    // Onboarding gate lives in home/page.tsx only.

    savedLat         = profile.latitude     ?? null;
    savedLon         = profile.longitude    ?? null;
    savedCity        = profile.city         ?? '';
    savedCountry     = profile.country      ?? '';
    savedCountryCode = profile.country_code ?? '';
    userName         = profile.full_name ?? profile.username ?? 'Sadhak';
    tradition        = profile.tradition ?? 'hindu';

    // Notifications mapping
    wantsFestivalReminders = profile.wants_festival_reminders ?? true;
    wantsShlokaReminders = profile.wants_shloka_reminders ?? true;
    wantsNityaReminders = profile.wants_nitya_reminders ?? true;
    wantsCommunityNotifications = profile.wants_community_notifications ?? true;
    wantsFamilyNotifications = profile.wants_family_notifications ?? true;

    const rawLang = profile.app_language ?? 'en';
    appLanguage = (['en', 'hi', 'pa'] as AppLang[]).includes(rawLang as AppLang)
      ? (rawLang as AppLang)
      : 'en';
  }

  return (
    <LanguageProvider lang={appLanguage}>
      <OneSignalIdentityProvider
        userId={userId || null}
        tradition={tradition}
        city={savedCity}
        countryCode={savedCountryCode}
        wantsFestivalReminders={wantsFestivalReminders}
        wantsShlokaReminders={wantsShlokaReminders}
        wantsNityaReminders={wantsNityaReminders}
        wantsCommunityNotifications={wantsCommunityNotifications}
        wantsFamilyNotifications={wantsFamilyNotifications}
      />
      <div className="min-h-screen flex min-w-0 flex-col overflow-x-hidden">
        <main className="flex-1 min-w-0 max-w-2xl mx-auto w-full overflow-x-hidden px-3 pt-0 pb-28 sm:px-4">
          <EngineProvider userId={userId || null} tradition={tradition}>
            <LocationProvider
              savedLat={savedLat}
              savedLon={savedLon}
              savedCity={savedCity}
              savedCountry={savedCountry}
              savedCountryCode={savedCountryCode}
            >
              {children}
            </LocationProvider>
          </EngineProvider>
        </main>
        <BottomNav isGuest={!user} />
        <AIChatFABWrapper userId={userId} tradition={tradition} userName={userName} isGuest={!user} appLanguage={appLanguage} />
        {/* Persist tradition to localStorage for cold-start loader */}
        {user && <TraditionSync tradition={tradition} />}
      </div>
    </LanguageProvider>
  );
}
