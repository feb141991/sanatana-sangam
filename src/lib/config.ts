/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Shoonaya — Central Config
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ALL external API endpoints, CDN URLs, timeouts, and app-wide defaults live
 * here. To update an endpoint or tweak a timeout, change it in ONE place.
 *
 * Usage:
 *   import { API, MAP, APP } from '@/lib/config';
 *   fetch(API.NOMINATIM.SEARCH)
 *   const timeout = API.OVERPASS.FETCH_TIMEOUT_MS
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── External API Endpoints ───────────────────────────────────────────────────

export const API = {

  /** OpenStreetMap Overpass — temple / place-of-worship data (no API key needed) */
  OVERPASS: {
    /** Mirrors tried in order. Server-side proxy at /api/tirtha/places uses these;
     *  the browser never calls Overpass directly (avoids CORS + client timeouts). */
    MIRRORS: [
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass.openstreetmap.fr/api/interpreter',
      'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
      'https://overpass.private.coffee/api/interpreter',
      'https://overpass-api.de/api/interpreter',
    ] as const,
    /** Overpass QL query-level timeout (seconds) — sent inside the query body */
    QUERY_TIMEOUT_S:    28,
    /** JS fetch() abort timeout per mirror attempt (ms) */
    FETCH_TIMEOUT_MS:   18_000,
    /** Default search radius in metres */
    DEFAULT_RADIUS_M:   10_000,
    /** Maximum results to render in the UI */
    MAX_RESULTS:        25,
  },

  /** Geoapify — primary geocoding (free tier: 3 000 calls/day, no credit card).
   *  Falls back to Nominatim when GEOAPIFY_API_KEY is not set. */
  GEOAPIFY: {
    GEOCODE: 'https://api.geoapify.com/v1/geocode/search',
    TIMEOUT_MS: 6_000,
  },

  /** Nominatim (OpenStreetMap) — geocoding fallback when Geoapify is unavailable */
  NOMINATIM: {
    BASE:     'https://nominatim.openstreetmap.org',
    SEARCH:   'https://nominatim.openstreetmap.org/search',
    REVERSE:  'https://nominatim.openstreetmap.org/reverse',
    TIMEOUT_MS: 10_000,
    USER_AGENT: 'SanatanaSangam/1.0',
  },

  /** OneSignal — web push notifications (App ID comes from env) */
  ONESIGNAL: {
    SDK_URL:  'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js',
    /** App ID is read from NEXT_PUBLIC_ONESIGNAL_APP_ID env var */
    APP_ID:   process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ?? '',
  },

} as const;


// ─── Map / Leaflet Config ─────────────────────────────────────────────────────

export const MAP = {

  /** Leaflet JS/CSS version (update here to upgrade everywhere) */
  LEAFLET_VERSION: '1.9.4',

  /** OpenStreetMap tile layer */
  TILE_URL:        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  TILE_ATTRIBUTION: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',

  /** Leaflet default marker icons (pulled from unpkg — matches LEAFLET_VERSION) */
  get MARKER_ICON()        { return `https://unpkg.com/leaflet@${this.LEAFLET_VERSION}/dist/images/marker-icon.png`; },
  get MARKER_ICON_2X()     { return `https://unpkg.com/leaflet@${this.LEAFLET_VERSION}/dist/images/marker-icon-2x.png`; },
  get MARKER_SHADOW()      { return `https://unpkg.com/leaflet@${this.LEAFLET_VERSION}/dist/images/marker-shadow.png`; },
  get LEAFLET_CSS()        { return `https://unpkg.com/leaflet@${this.LEAFLET_VERSION}/dist/leaflet.css`; },

  /** Google Maps directions deep-link */
  googleDirections: (lat: number, lon: number) =>
    `https://maps.google.com/?q=${lat},${lon}`,

  /** Default map center when location is unavailable (London) */
  DEFAULT_CENTER: [51.5074, -0.1278] as [number, number],

  /** Default zoom levels */
  ZOOM: {
    DEFAULT:  13,
    CITY:     11,
    DETAIL:   16,
  },

} as const;


// ─── Geolocation / Location Config ───────────────────────────────────────────

export const LOCATION = {
  /** navigator.geolocation options */
  GEO_OPTIONS: {
    timeout:     10_000,          // 10 seconds to get a fix
    maximumAge:  5 * 60 * 1000,  // accept cached position up to 5 min old
  },
} as const;


// ─── App URLs ─────────────────────────────────────────────────────────────────

export const APP = {
  /**
   * Public base URL for share links and invite deep-links.
   * Set NEXT_PUBLIC_APP_URL in .env.local to override (e.g. your Vercel domain).
   * Falls back to shoonaya.com — but at runtime in client components
   * prefer window.location.origin so any deployment domain works automatically.
   */
  BASE_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'https://shoonaya.com',
} as const;


// ─── App-wide Visual / Brand Config ──────────────────────────────────────────

export const BRAND = {
  COLORS: {
    MAROON:       '#1F6B72',
    MAROON_DARK:  '#164D54',
    MAROON_LIGHT: '#6F9E9B',
    CREAM:        '#F7F3EB',
    ORANGE:       '#C3872F',
  },
} as const;


// ─── Aarti / Mandir Schedule Defaults ────────────────────────────────────────

export const MANDIR = {
  /** Default aarti times shown when a temple has no opening_hours data */
  DEFAULT_AARTI_TIMES: ['6:00 AM', '12:00 PM', '7:00 PM'] as const,
  /** Simple heuristic: mandirs are "open" between these hours */
  OPEN_HOUR:  6,
  CLOSE_HOUR: 21,
} as const;
