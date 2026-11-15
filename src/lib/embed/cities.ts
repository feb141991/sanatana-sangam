/**
 * Curated city presets for the Shoonaya embeddable Panchang widget.
 * Provides instant, zero-latency coordinates and IANA timezones for major
 * global diaspora and Indian metropolitan regions.
 */

export interface EmbedCityPreset {
  id: string;
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  tz: string;
}

export const EMBED_POPULAR_CITIES: Record<string, EmbedCityPreset> = {
  // ── Bharat (Reference & Major Metros) ──────────────────────────────────
  ujjain: {
    id: 'ujjain',
    name: 'Ujjain (Avanti Prime Meridian)',
    region: 'Madhya Pradesh',
    country: 'India',
    lat: 23.1765,
    lon: 75.7885,
    tz: 'Asia/Kolkata',
  },
  'new-delhi': {
    id: 'new-delhi',
    name: 'New Delhi / NCR',
    region: 'Delhi',
    country: 'India',
    lat: 28.6139,
    lon: 77.209,
    tz: 'Asia/Kolkata',
  },
  mumbai: {
    id: 'mumbai',
    name: 'Mumbai',
    region: 'Maharashtra',
    country: 'India',
    lat: 19.076,
    lon: 72.8777,
    tz: 'Asia/Kolkata',
  },
  bengaluru: {
    id: 'bengaluru',
    name: 'Bengaluru',
    region: 'Karnataka',
    country: 'India',
    lat: 12.9716,
    lon: 77.5946,
    tz: 'Asia/Kolkata',
  },
  varanasi: {
    id: 'varanasi',
    name: 'Varanasi (Kashi)',
    region: 'Uttar Pradesh',
    country: 'India',
    lat: 25.3176,
    lon: 82.9739,
    tz: 'Asia/Kolkata',
  },
  chennai: {
    id: 'chennai',
    name: 'Chennai',
    region: 'Tamil Nadu',
    country: 'India',
    lat: 13.0827,
    lon: 80.2707,
    tz: 'Asia/Kolkata',
  },
  kolkata: {
    id: 'kolkata',
    name: 'Kolkata',
    region: 'West Bengal',
    country: 'India',
    lat: 22.5726,
    lon: 88.3639,
    tz: 'Asia/Kolkata',
  },
  ahmedabad: {
    id: 'ahmedabad',
    name: 'Ahmedabad',
    region: 'Gujarat',
    country: 'India',
    lat: 23.0225,
    lon: 72.5714,
    tz: 'Asia/Kolkata',
  },
  hyderabad: {
    id: 'hyderabad',
    name: 'Hyderabad',
    region: 'Telangana',
    country: 'India',
    lat: 17.385,
    lon: 78.4867,
    tz: 'Asia/Kolkata',
  },

  // ── United States ────────────────────────────────────────────────────────
  'new-york': {
    id: 'new-york',
    name: 'New York (Metro / Tristate)',
    region: 'New York',
    country: 'USA',
    lat: 40.7128,
    lon: -74.006,
    tz: 'America/New_York',
  },
  'san-francisco': {
    id: 'san-francisco',
    name: 'San Francisco (Bay Area / Silicon Valley)',
    region: 'California',
    country: 'USA',
    lat: 37.7749,
    lon: -122.4194,
    tz: 'America/Los_Angeles',
  },
  chicago: {
    id: 'chicago',
    name: 'Chicago',
    region: 'Illinois',
    country: 'USA',
    lat: 41.8781,
    lon: -87.6298,
    tz: 'America/Chicago',
  },
  dallas: {
    id: 'dallas',
    name: 'Dallas / Fort Worth',
    region: 'Texas',
    country: 'USA',
    lat: 32.7767,
    lon: -96.797,
    tz: 'America/Chicago',
  },
  houston: {
    id: 'houston',
    name: 'Houston',
    region: 'Texas',
    country: 'USA',
    lat: 29.7604,
    lon: -95.3698,
    tz: 'America/Chicago',
  },
  atlanta: {
    id: 'atlanta',
    name: 'Atlanta',
    region: 'Georgia',
    country: 'USA',
    lat: 33.749,
    lon: -84.388,
    tz: 'America/New_York',
  },
  seattle: {
    id: 'seattle',
    name: 'Seattle',
    region: 'Washington',
    country: 'USA',
    lat: 47.6062,
    lon: -122.3321,
    tz: 'America/Los_Angeles',
  },

  // ── United Kingdom ───────────────────────────────────────────────────────
  london: {
    id: 'london',
    name: 'London',
    region: 'Greater London',
    country: 'United Kingdom',
    lat: 51.5074,
    lon: -0.1278,
    tz: 'Europe/London',
  },
  leicester: {
    id: 'leicester',
    name: 'Leicester',
    region: 'East Midlands',
    country: 'United Kingdom',
    lat: 52.6369,
    lon: -1.1398,
    tz: 'Europe/London',
  },
  birmingham: {
    id: 'birmingham',
    name: 'Birmingham',
    region: 'West Midlands',
    country: 'United Kingdom',
    lat: 52.4862,
    lon: -1.8904,
    tz: 'Europe/London',
  },

  // ── Canada ───────────────────────────────────────────────────────────────
  toronto: {
    id: 'toronto',
    name: 'Toronto (GTA)',
    region: 'Ontario',
    country: 'Canada',
    lat: 43.6532,
    lon: -79.3832,
    tz: 'America/Toronto',
  },
  vancouver: {
    id: 'vancouver',
    name: 'Vancouver',
    region: 'British Columbia',
    country: 'Canada',
    lat: 49.2827,
    lon: -123.1207,
    tz: 'America/Vancouver',
  },
  calgary: {
    id: 'calgary',
    name: 'Calgary',
    region: 'Alberta',
    country: 'Canada',
    lat: 51.0447,
    lon: -114.0719,
    tz: 'America/Edmonton',
  },

  // ── Australia & New Zealand ──────────────────────────────────────────────
  sydney: {
    id: 'sydney',
    name: 'Sydney',
    region: 'New South Wales',
    country: 'Australia',
    lat: -33.8688,
    lon: 151.2093,
    tz: 'Australia/Sydney',
  },
  melbourne: {
    id: 'melbourne',
    name: 'Melbourne',
    region: 'Victoria',
    country: 'Australia',
    lat: -37.8136,
    lon: 144.9631,
    tz: 'Australia/Melbourne',
  },
  brisbane: {
    id: 'brisbane',
    name: 'Brisbane',
    region: 'Queensland',
    country: 'Australia',
    lat: -27.4698,
    lon: 153.0251,
    tz: 'Australia/Brisbane',
  },
  auckland: {
    id: 'auckland',
    name: 'Auckland',
    region: 'North Island',
    country: 'New Zealand',
    lat: -36.8485,
    lon: 174.7633,
    tz: 'Pacific/Auckland',
  },

  // ── Asia & Middle East ───────────────────────────────────────────────────
  singapore: {
    id: 'singapore',
    name: 'Singapore',
    region: 'Singapore',
    country: 'Singapore',
    lat: 1.3521,
    lon: 103.8198,
    tz: 'Asia/Singapore',
  },
  'kuala-lumpur': {
    id: 'kuala-lumpur',
    name: 'Kuala Lumpur',
    region: 'Federal Territory',
    country: 'Malaysia',
    lat: 3.139,
    lon: 101.6869,
    tz: 'Asia/Kuala_Lumpur',
  },
  dubai: {
    id: 'dubai',
    name: 'Dubai',
    region: 'Emirate of Dubai',
    country: 'United Arab Emirates',
    lat: 25.2048,
    lon: 55.2708,
    tz: 'Asia/Dubai',
  },
};

export const DEFAULT_EMBED_CITY = EMBED_POPULAR_CITIES['ujjain'];

export function resolveEmbedCity(params: {
  city?: string | null;
  lat?: string | number | null;
  lon?: string | number | null;
  tz?: string | null;
}): EmbedCityPreset {
  // 1. Direct coordinates provided
  if (params.lat != null && params.lon != null) {
    const lat = typeof params.lat === 'number' ? params.lat : parseFloat(params.lat);
    const lon = typeof params.lon === 'number' ? params.lon : parseFloat(params.lon);
    if (Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      const tz = params.tz?.trim() || 'UTC';
      const name = params.city?.trim() || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
      return {
        id: 'custom',
        name,
        region: 'Custom Coordinates',
        country: 'Global',
        lat,
        lon,
        tz,
      };
    }
  }

  // 2. City slug lookup
  if (params.city) {
    const normalized = params.city.trim().toLowerCase().replace(/\s+/g, '-');
    if (EMBED_POPULAR_CITIES[normalized]) {
      return EMBED_POPULAR_CITIES[normalized];
    }

    // Partial match search
    const match = Object.values(EMBED_POPULAR_CITIES).find(
      (c) =>
        c.id.includes(normalized) ||
        c.name.toLowerCase().includes(normalized) ||
        normalized.includes(c.id),
    );
    if (match) return match;
  }

  // Fallback to default Ujjain
  return DEFAULT_EMBED_CITY;
}

