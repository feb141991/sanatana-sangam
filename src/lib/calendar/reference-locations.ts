import type { LocationInput } from '@sangam/panchang-engine';

export interface ReferenceLocation {
  slug: string;
  displayName: string;
  country: string;
  lat: number;
  lon: number;
  tz: string;
}

/**
 * Council-ratified Tier-1 Reference Locations for per-location festival materialization.
 * Encompasses Ujjain meridian plus primary Indian & global diaspora population hubs.
 */
export const REFERENCE_LOCATIONS: ReferenceLocation[] = [
  { slug: 'ujjain_india', displayName: 'Ujjain, India', country: 'IN', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
  { slug: 'delhi_india', displayName: 'New Delhi, India', country: 'IN', lat: 28.6139, lon: 77.2090, tz: 'Asia/Kolkata' },
  { slug: 'mumbai_india', displayName: 'Mumbai, India', country: 'IN', lat: 19.0760, lon: 72.8777, tz: 'Asia/Kolkata' },
  { slug: 'chennai_india', displayName: 'Chennai, India', country: 'IN', lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata' },
  { slug: 'kolkata_india', displayName: 'Kolkata, India', country: 'IN', lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata' },
  { slug: 'london_uk', displayName: 'London, UK', country: 'GB', lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
  { slug: 'bedford_uk', displayName: 'Bedford, UK', country: 'GB', lat: 52.1356, lon: -0.4685, tz: 'Europe/London' },
  { slug: 'leicester_uk', displayName: 'Leicester, UK', country: 'GB', lat: 52.6369, lon: -1.1398, tz: 'Europe/London' },
  { slug: 'new_york_usa', displayName: 'New York, USA', country: 'US', lat: 40.7128, lon: -74.0060, tz: 'America/New_York' },
  { slug: 'san_francisco_usa', displayName: 'San Francisco, USA', country: 'US', lat: 37.7749, lon: -122.4194, tz: 'America/Los_Angeles' },
  { slug: 'toronto_canada', displayName: 'Toronto, Canada', country: 'CA', lat: 43.6532, lon: -79.3832, tz: 'America/Toronto' },
  { slug: 'sydney_australia', displayName: 'Sydney, Australia', country: 'AU', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
  { slug: 'melbourne_australia', displayName: 'Melbourne, Australia', country: 'AU', lat: -37.8136, lon: 144.9631, tz: 'Australia/Melbourne' },
  { slug: 'dubai_uae', displayName: 'Dubai, UAE', country: 'AE', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai' },
  { slug: 'singapore_singapore', displayName: 'Singapore', country: 'SG', lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore' },
];

/**
 * Calculates approximate great-circle angular distance (in radians) between two geographic points.
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Resolves a given input location to the nearest reference city in the catalog.
 * Prioritizes matching timezone first, then finds minimum geographic distance.
 */
export function findNearestReferenceLocation(location: LocationInput): ReferenceLocation {
  const sameTzLocations = REFERENCE_LOCATIONS.filter((ref) => ref.tz === location.tz);
  const candidates = sameTzLocations.length > 0 ? sameTzLocations : REFERENCE_LOCATIONS;

  let nearest = candidates[0];
  let minDistance = haversineDistance(location.lat, location.lon, nearest.lat, nearest.lon);

  for (let i = 1; i < candidates.length; i++) {
    const dist = haversineDistance(location.lat, location.lon, candidates[i].lat, candidates[i].lon);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = candidates[i];
    }
  }

  return nearest;
}
