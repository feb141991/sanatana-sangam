'use client';

/**
 * LocationContext
 * ──────────────
 * Asks the browser for location ONCE when the app loads.
 * Shares coords, city, country, and countryCode across all pages.
 *
 * Exposes:
 *   coords      : { lat, lon } | null
 *   city        : string  (e.g. "Leicester")
 *   country     : string  (e.g. "United Kingdom")
 *   countryCode : string  (e.g. "GB")
 *   loading     : boolean
 *   error       : string | null
 *   refresh     : () => void
 */

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { API, LOCATION } from '@/lib/config';
import PermissionSheet from '@/components/ui/PermissionSheet';

export interface Coords {
  lat: number;
  lon: number;
}

interface LocationState {
  coords:      Coords | null;
  city:        string;
  country:     string;
  countryCode: string;
  loading:     boolean;
  error:       string | null;
  refresh:     (force?: boolean) => void;
  showLocationSheet: boolean;
  confirmLocationRequest: () => void;
  dismissLocationSheet: () => void;
}

const LocationContext = createContext<LocationState>({
  coords:      null,
  city:        '',
  country:     '',
  countryCode: '',
  loading:     false,
  error:       null,
  refresh:     (force?: boolean) => {},
  showLocationSheet: false,
  confirmLocationRequest: () => {},
  dismissLocationSheet: () => {},
});

export function useLocation() {
  return useContext(LocationContext);
}

interface GeoInfo {
  city:        string;
  country:     string;
  countryCode: string;
}

const AUTO_REQUEST_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const AUTO_REQUEST_STORAGE_KEY = 'sangam:auto-location-requested-at';

async function reverseGeocode(lat: number, lon: number): Promise<GeoInfo> {
  try {
    const res = await fetch(
      `${API.NOMINATIM.REVERSE}?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': API.NOMINATIM.USER_AGENT } }
    );
    if (!res.ok) return { city: '', country: '', countryCode: '' };
    const data = await res.json();
    return {
      city: (
        data?.address?.city    ??
        data?.address?.town    ??
        data?.address?.village ??
        data?.address?.county  ??
        ''
      ),
      country:     data?.address?.country              ?? '',
      countryCode: (data?.address?.country_code ?? '').toUpperCase(),
    };
  } catch {
    return { city: '', country: '', countryCode: '' };
  }
}

interface Props {
  children:        React.ReactNode;
  savedLat?:       number | null;
  savedLon?:       number | null;
  savedCity?:      string;
  savedCountry?:   string;
  savedCountryCode?: string;
}

export function LocationProvider({
  children,
  savedLat,
  savedLon,
  savedCity        = '',
  savedCountry     = '',
  savedCountryCode = '',
}: Props) {
  const pathname = usePathname();
  const [coords,      setCoords]      = useState<Coords | null>(
    savedLat && savedLon ? { lat: savedLat, lon: savedLon } : null
  );
  const [city,        setCity]        = useState<string>(savedCity);
  const [country,     setCountry]     = useState<string>(savedCountry);
  const [countryCode, setCountryCode] = useState<string>(savedCountryCode);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  // Tracks whether we've already attempted auto-location this session so we
  // don't re-ask every time the user navigates back to /home or /tirtha-map.
  const autoLocateAttempted = useRef(false);

  const shouldAutoLocate = pathname === '/home' || pathname === '/mandali' || pathname === '/profile' || pathname === '/tirtha-map';

  const requestLocation = useCallback((force = false) => {
    if (!force && typeof window !== 'undefined') {
      const lastAttempt = Number(window.localStorage.getItem(AUTO_REQUEST_STORAGE_KEY) ?? '0');
      if (lastAttempt && (Date.now() - lastAttempt) < AUTO_REQUEST_COOLDOWN_MS) return;
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTO_REQUEST_STORAGE_KEY, String(Date.now()));
    }
    if (!navigator.geolocation) {
      setError('Geolocation not supported by this browser');
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lon: longitude });
        setLoading(false);
        // Reverse geocode in background — fills city, country, countryCode
        const info = await reverseGeocode(latitude, longitude);
        if (info.city)        setCity(info.city);
        if (info.country)     setCountry(info.country);
        if (info.countryCode) setCountryCode(info.countryCode);
      },
      (err) => {
        setLoading(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied'
            : 'Could not determine your location'
        );
      },
      LOCATION.GEO_OPTIONS
    );
  }, []);

  // Ask for location lazily, only on location-aware screens, and not on every navigation.
  useEffect(() => {
    // Already have coords from DB props or from a previous fetch this session
    if (savedLat && savedLon) return;
    if (coords) return;
    if (!shouldAutoLocate) return;
    if (typeof window === 'undefined') return;
    // Only attempt once per session — prevents re-asking on every /home visit
    if (autoLocateAttempted.current) return;
    autoLocateAttempted.current = true;

    const run = async () => {
      const existingPerm = await navigator.permissions.query({ name: 'geolocation' }).catch(() => null);
      if (existingPerm?.state === 'granted') {
        requestLocation();
      } else if (existingPerm?.state === 'prompt') {
        setShowLocationSheet(true);
      }
    };

    const browserWindow = window as Window & typeof globalThis & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    let idleCallbackId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (typeof browserWindow.requestIdleCallback === 'function') {
      idleCallbackId = browserWindow.requestIdleCallback(() => run(), { timeout: 1500 });
    } else {
      timeoutId = globalThis.setTimeout(run, 900);
    }

    return () => {
      if (typeof browserWindow.cancelIdleCallback === 'function' && idleCallbackId !== null) {
        browserWindow.cancelIdleCallback(idleCallbackId);
      }
      if (timeoutId !== null) {
        globalThis.clearTimeout(timeoutId);
      }
    };
  }, [requestLocation, savedLat, savedLon, shouldAutoLocate, coords]);

  const confirmLocationRequest = useCallback(() => {
    setShowLocationSheet(false);
    requestLocation();
  }, [requestLocation]);

  const dismissLocationSheet = useCallback(() => {
    setShowLocationSheet(false);
  }, []);

  return (
    <LocationContext.Provider value={{
      coords, city, country, countryCode, loading, error, refresh: requestLocation,
      showLocationSheet, confirmLocationRequest, dismissLocationSheet
    }}>
      {children}
      <PermissionSheet
        type="location"
        open={showLocationSheet}
        onAllow={confirmLocationRequest}
        onDeny={dismissLocationSheet}
      />
    </LocationContext.Provider>
  );
}
