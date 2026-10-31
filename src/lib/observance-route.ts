import { resolveVratSlug } from './vrat-data';

export function buildObservanceHref(
  routeKind: string | null | undefined,
  routeSlug: string | null | undefined,
): string {
  const slug = routeSlug?.trim();

  if (routeKind === 'vrat') {
    return slug && slug !== 'vrat' ? `/vrat/${slug}` : '/vrat';
  }

  if (routeKind === 'festival' && slug) {
    return `/festival/${slug}`;
  }

  return '/panchang';
}

export function getPulseRouteSlug(label: string): string | null {
  const normalized = label.toLowerCase().trim();

  // Explicit canonical named mapping first to prevent substring swallowing
  const namedSlug = resolveVratSlug(normalized);
  if (namedSlug && namedSlug !== 'ekadashi') {
    return namedSlug;
  }

  if (normalized.includes('shivaratri')) return 'shivaratri';
  // Generic Ekadashi tithi fallback: only for generic ekadashi labels
  if (normalized === 'ekadashi' || normalized === 'ekadasi' || normalized === 'ekadashi vrat') {
    return 'ekadashi';
  }
  if (normalized.includes('pradosh')) return 'pradosh';
  if (normalized.includes('chaturthi')) return 'chaturthi';
  if (normalized.includes('purnima')) return 'purnima';
  if (normalized.includes('amavasya')) return 'amavasya';
  if (normalized.includes('puranmashi') || normalized.includes('sangrand')) return 'puranmashi';
  if (normalized.includes('uposatha')) return 'uposatha';
  return null;
}
