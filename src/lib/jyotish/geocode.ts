/**
 * geocode.ts — Birth city → coordinates + IANA timezone
 *
 * Uses OpenStreetMap Nominatim for geocoding (free, no API key).
 * Uses geo-tz (local DB, no API call) to resolve IANA timezone from coords.
 *
 * Global-ready: handles any city worldwide with historical DST via IANA tz.
 */

import { find as geoTzFind } from 'geo-tz';

export interface GeoResult {
  city:      string;        // Display name returned by Nominatim
  country:   string;        // Country name
  countryCode: string;      // ISO 3166-1 alpha-2
  lat:       number;        // Decimal degrees
  lng:       number;        // Decimal degrees
  timezone:  string;        // IANA timezone string e.g. 'Asia/Kolkata'
}

/** Nominatim response shape (partial) */
interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    country?: string;
    country_code?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT     = 'Shoonaya-App/1.0 (contact@shoonaya.com)';

/**
 * Geocode a city name query → lat/lng + IANA timezone.
 * Returns the best single result from Nominatim.
 *
 * @param query   Free-text city query, e.g. "Mumbai, India" or "New York"
 * @throws        Error if no results or network failure
 */
export async function geocodeCity(query: string): Promise<GeoResult> {
  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    },
    next: { revalidate: 86400 }, // cache geocode results for 24h (Next.js fetch cache)
  });

  if (!res.ok) {
    throw new Error(`Nominatim returned ${res.status}: ${res.statusText}`);
  }

  const results: NominatimResult[] = await res.json();

  if (!results || results.length === 0) {
    throw new Error(`No location found for: "${query}"`);
  }

  const hit = results[0];
  const lat  = parseFloat(hit.lat);
  const lng  = parseFloat(hit.lon);

  // geo-tz returns array of IANA tz strings; take first (most specific).
  // Fall back to 'UTC' rather than throwing — timezone is a recoverable issue.
  const tzCandidates = geoTzFind(lat, lng);
  const timezone = tzCandidates?.[0] ?? 'UTC';

  const addr    = hit.address ?? {};
  const city    = addr.city ?? addr.town ?? addr.village ?? addr.state ?? query;
  const country = addr.country ?? '';
  const countryCode = (addr.country_code ?? '').toUpperCase();

  return { city, country, countryCode, lat, lng, timezone };
}

/**
 * Reverse-geocode coordinates to get city info + timezone.
 * Useful when user taps "use my location" on browser.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeoResult> {
  const url = new URL(`${NOMINATIM_BASE}/reverse`);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Nominatim reverse returned ${res.status}`);
  }

  const hit: NominatimResult & { address?: NominatimResult['address'] } = await res.json();

  const tzCandidates = geoTzFind(lat, lng);
  const timezone = tzCandidates?.[0] ?? 'UTC';

  const addr    = hit.address ?? {};
  const city    = addr.city ?? addr.town ?? addr.village ?? addr.state ?? `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const country = addr.country ?? '';
  const countryCode = (addr.country_code ?? '').toUpperCase();

  return { city, country, countryCode, lat, lng, timezone };
}
