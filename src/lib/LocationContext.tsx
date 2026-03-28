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

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { API, LOCATION } from '@/lib/config';

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
  refresh:     () => void;
}

const LocationContext = createContext<LocationState>({
  coords:      null,
  city:        '',
  country:     '',
  countryCode: '',
  loading:     false,
  error:       null,
  refresh:     () => {},
});

export function useLocation() {
  return useContext(LocationContext);
}

interface GeoInfo {
  city:        string;
  country:     string;
  countryCode: string;
}

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
  const [coords,      setCoords]      = useState<Coords | null>(
    savedLat && savedLon ? { lat: savedLat, lon: savedLon } : null
  );
  const [city,        setCity]        = useState<string>(savedCity);
  const [country,     setCountry]     = useState<string>(savedCountry);
  const [countryCode, setCountryCode] = useState<string>(savedCountryCode);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const requestLocation = useCallback(() => {
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

  // Ask for location on first mount (only if no saved coords)
  useEffect(() => {
    if (!savedLat || !savedLon) {
      requestLocation();
    }
  }, []);

  return (
    <LocationContext.Provider value={{
      coords, city, country, countryCode, loading, error, refresh: requestLocation,
    }}>
      {children}
    </LocationContext.Provider>
  );
}
