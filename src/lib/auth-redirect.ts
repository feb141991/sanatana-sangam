'use client';

import { APP } from '@/lib/config';

function isLocalOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

export function getAuthCallbackUrl(next: string, origin = window.location.origin) {
  const baseUrl = isLocalOrigin(origin) ? origin : APP.BASE_URL;
  return `${baseUrl}/auth/callback?next=${encodeURIComponent(next)}`;
}
