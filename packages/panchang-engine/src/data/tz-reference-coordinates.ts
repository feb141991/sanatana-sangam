/**
 * IANA timezone -> reference coordinate, in the spirit of the standard
 * `zone1970.tab` table (each zone's coordinate is its namesake city's
 * location). Used only as a coarse fallback when a user has a known
 * timezone but no saved/device GPS coordinates -- see
 * `resolveObservanceLocationBucket` in `../index.ts`.
 *
 * Deliberately NOT a full ~450-zone mirror of zone1970.tab: this repo's
 * house style is to author the specific reference data actually needed
 * (see the calendar-profile month-name tables) rather than add a
 * dependency or ship data nothing here will use. Scoped to India (where
 * `profiles.timezone` is concentrated today) plus the major Hindu/Sikh/
 * Buddhist/Jain diaspora regions this product targets. Add a zone here if
 * `SELECT DISTINCT timezone FROM profiles` ever surfaces one that's
 * missing -- this table growing over time is expected, not a bug.
 */
export const TZ_REFERENCE_COORDINATES: Record<string, { lat: number; lon: number }> = {
  // India (also the legacy pre-1996 alias, still seen in some profiles)
  'Asia/Kolkata': { lat: 22.5726, lon: 88.3639 },
  'Asia/Calcutta': { lat: 22.5726, lon: 88.3639 },

  // South Asia
  'Asia/Kathmandu': { lat: 27.7172, lon: 85.3240 },
  'Asia/Dhaka': { lat: 23.8103, lon: 90.4125 },
  'Asia/Colombo': { lat: 6.9271, lon: 79.8612 },
  'Asia/Karachi': { lat: 24.8607, lon: 67.0011 },
  'Asia/Thimphu': { lat: 27.4728, lon: 89.6390 },

  // UK / Europe
  'Europe/London': { lat: 51.5074, lon: -0.1278 },
  'Europe/Dublin': { lat: 53.3498, lon: -6.2603 },
  'Europe/Berlin': { lat: 52.5200, lon: 13.4050 },
  'Europe/Paris': { lat: 48.8566, lon: 2.3522 },
  'Europe/Amsterdam': { lat: 52.3676, lon: 4.9041 },
  'Europe/Madrid': { lat: 40.4168, lon: -3.7038 },
  'Europe/Rome': { lat: 41.9028, lon: 12.4964 },
  'Europe/Zurich': { lat: 47.3769, lon: 8.5417 },
  'Europe/Stockholm': { lat: 59.3293, lon: 18.0686 },
  'Europe/Oslo': { lat: 59.9139, lon: 10.7522 },
  'Europe/Lisbon': { lat: 38.7223, lon: -9.1393 },
  'Europe/Istanbul': { lat: 41.0082, lon: 28.9784 },
  'Europe/Moscow': { lat: 55.7558, lon: 37.6173 },

  // North America
  'America/New_York': { lat: 40.7128, lon: -74.0060 },
  'America/Chicago': { lat: 41.8781, lon: -87.6298 },
  'America/Denver': { lat: 39.7392, lon: -104.9903 },
  'America/Los_Angeles': { lat: 34.0522, lon: -118.2437 },
  'America/Anchorage': { lat: 61.2181, lon: -149.9003 },
  'Pacific/Honolulu': { lat: 21.3069, lon: -157.8583 },
  'America/Toronto': { lat: 43.6532, lon: -79.3832 },
  'America/Vancouver': { lat: 49.2827, lon: -123.1207 },
  'America/Edmonton': { lat: 53.5461, lon: -113.4938 },
  'America/Winnipeg': { lat: 49.8951, lon: -97.1384 },
  'America/Mexico_City': { lat: 19.4326, lon: -99.1332 },

  // Caribbean / South America (Indo-Caribbean diaspora)
  'America/Port_of_Spain': { lat: 10.6549, lon: -61.5019 },
  'America/Guyana': { lat: 6.8013, lon: -58.1551 },
  'America/Paramaribo': { lat: 5.8520, lon: -55.2038 },
  'America/Sao_Paulo': { lat: -23.5505, lon: -46.6333 },

  // Middle East / Gulf (large South Asian diaspora)
  'Asia/Dubai': { lat: 25.2048, lon: 55.2708 },
  'Asia/Qatar': { lat: 25.2854, lon: 51.5310 },
  'Asia/Riyadh': { lat: 24.7136, lon: 46.6753 },
  'Asia/Kuwait': { lat: 29.3759, lon: 47.9774 },
  'Asia/Bahrain': { lat: 26.0667, lon: 50.5577 },
  'Asia/Muscat': { lat: 23.5859, lon: 58.4059 },
  'Asia/Jerusalem': { lat: 31.7683, lon: 35.2137 },

  // Southeast / East Asia
  'Asia/Singapore': { lat: 1.3521, lon: 103.8198 },
  'Asia/Kuala_Lumpur': { lat: 3.1390, lon: 101.6869 },
  'Asia/Bangkok': { lat: 13.7563, lon: 100.5018 },
  'Asia/Jakarta': { lat: -6.2088, lon: 106.8456 },
  'Asia/Manila': { lat: 14.5995, lon: 120.9842 },
  'Asia/Hong_Kong': { lat: 22.3193, lon: 114.1694 },
  'Asia/Shanghai': { lat: 31.2304, lon: 121.4737 },
  'Asia/Tokyo': { lat: 35.6762, lon: 139.6503 },
  'Asia/Seoul': { lat: 37.5665, lon: 126.9780 },

  // Oceania
  'Australia/Sydney': { lat: -33.8688, lon: 151.2093 },
  'Australia/Melbourne': { lat: -37.8136, lon: 144.9631 },
  'Australia/Brisbane': { lat: -27.4698, lon: 153.0251 },
  'Australia/Perth': { lat: -31.9505, lon: 115.8605 },
  'Australia/Adelaide': { lat: -34.9285, lon: 138.6007 },
  'Pacific/Auckland': { lat: -36.8485, lon: 174.7633 },
  'Pacific/Fiji': { lat: -18.1416, lon: 178.4419 },

  // Africa (Indian Ocean / East/Southern African diaspora)
  'Africa/Johannesburg': { lat: -26.2041, lon: 28.0473 },
  'Africa/Nairobi': { lat: -1.2921, lon: 36.8219 },
  'Africa/Cairo': { lat: 30.0444, lon: 31.2357 },
  'Africa/Lagos': { lat: 6.5244, lon: 3.3792 },
  'Indian/Mauritius': { lat: -20.1609, lon: 57.5012 },

  // Fallback zero-offset reference
  'UTC': { lat: 51.4769, lon: 0.0 }, // Royal Observatory, Greenwich -- the zone's own namesake reference point
  'Etc/UTC': { lat: 51.4769, lon: 0.0 },
};
