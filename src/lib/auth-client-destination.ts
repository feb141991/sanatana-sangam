'use client';

type AuthDestinationResponse = {
  destination?: unknown;
};

function isSafeInternalPath(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
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
