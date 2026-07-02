import type { Database } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export type AuthDestinationProfile = Pick<ProfileRow, 'onboarding_completed'> | null;

const FALLBACK_APP_DESTINATION = '/home';
const ONBOARDING_DESTINATION = '/onboarding';

function isSafeInternalPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//');
}

function isPublicAuthPath(path: string): boolean {
  return (
    path === '/' ||
    path === '/login' ||
    path === '/signup' ||
    path === '/whatsapp-login' ||
    path === '/forgot-password' ||
    path === '/reset-password' ||
    path === '/confirm-email' ||
    path.startsWith('/auth/')
  );
}

function isOnboardingPath(path: string): boolean {
  return path === ONBOARDING_DESTINATION || path.startsWith(`${ONBOARDING_DESTINATION}?`);
}

export function getSafeAuthNext(rawNext: string | null, fallback = FALLBACK_APP_DESTINATION): string {
  if (!rawNext || !isSafeInternalPath(rawNext)) return fallback;
  return rawNext;
}

export function resolvePostAuthDestination(
  profile: AuthDestinationProfile,
  requestedNext: string,
): string {
  if (profile?.onboarding_completed === false) {
    return isOnboardingPath(requestedNext) ? requestedNext : ONBOARDING_DESTINATION;
  }

  if (profile?.onboarding_completed === true) {
    return isOnboardingPath(requestedNext) || isPublicAuthPath(requestedNext)
      ? FALLBACK_APP_DESTINATION
      : requestedNext;
  }

  return FALLBACK_APP_DESTINATION;
}
