'use client';

type AuthDestinationResponse = {
  destination?: unknown;
};

export function isSafeInternalPath(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
}

type AuthLocation = Pick<Location, 'assign'>;

/**
 * Start the authenticated tree with a fresh document request. A soft App
 * Router transition can reuse the anonymous RSC tree that rendered the login
 * page before Supabase finished persisting its cookies, which is especially
 * fragile in installed PWAs and WebKit.
 */
export function navigateAfterAuthentication(
  destination: unknown,
  fallback = '/home',
  locationTarget?: AuthLocation,
): string {
  const safeFallback = isSafeInternalPath(fallback) ? fallback : '/home';
  const target = isSafeInternalPath(destination) ? destination : safeFallback;
  const browserLocation = locationTarget ?? (typeof window !== 'undefined' ? window.location : null);
  browserLocation?.assign(target);
  return target;
}

export async function getClientPostAuthDestination(next = '/home') {
  const fallback = next.startsWith('/') && !next.startsWith('//') ? next : '/home';

  try {
    const response = await fetch(`/api/auth/destination?next=${encodeURIComponent(fallback)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) return fallback;

    const data = await response.json() as AuthDestinationResponse;
    return isSafeInternalPath(data.destination) ? data.destination : fallback;
  } catch {
    return fallback;
  }
}
