import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/lib/config';

export interface GeocodeSuggestion {
  label: string;
  lat: number;
  lon: number;
}

async function geocodeWithGeoapify(q: string, limit: number): Promise<GeocodeSuggestion[] | null> {
  const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
  if (!apiKey) return null;

  const url = `${API.GEOAPIFY.GEOCODE}?text=${encodeURIComponent(q)}&format=json&limit=${limit}&apiKey=${apiKey}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API.GEOAPIFY.TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{
        formatted?: string;
        address_line1?: string;
        address_line2?: string;
        lat: number;
        lon: number;
      }>;
    };
    if (!data.results?.length) return null;
    return data.results.map((r) => ({
      label:
        r.formatted ||
        [r.address_line1, r.address_line2].filter(Boolean).join(', ') ||
        `${r.lat}, ${r.lon}`,
      lat: r.lat,
      lon: r.lon,
    }));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function geocodeWithNominatim(q: string, limit: number): Promise<GeocodeSuggestion[] | null> {
  const url = `${API.NOMINATIM.SEARCH}?q=${encodeURIComponent(q)}&format=json&limit=${limit}&addressdetails=0`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API.NOMINATIM.TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': API.NOMINATIM.USER_AGENT, 'Accept-Language': 'en' },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
    if (!data.length) return null;
    return data.map((r) => ({
      label: r.display_name || `${r.lat}, ${r.lon}`,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
    }));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q) {
    return NextResponse.json({ error: 'q is required' }, { status: 400 });
  }

  const limitParam = req.nextUrl.searchParams.get('limit');
  const parsedLimit = limitParam ? parseInt(limitParam, 10) : 1;
  const limit = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 1, 1), 5);

  // Try Geoapify first (more accurate, especially for diaspora city names)
  const results = (await geocodeWithGeoapify(q, limit)) ?? (await geocodeWithNominatim(q, limit));

  if (!results || results.length === 0) {
    return NextResponse.json({ error: `Could not find "${q}"` }, { status: 404 });
  }

  if (limit > 1) {
    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'public, s-maxage=86400' },
    });
  }

  return NextResponse.json(
    { lat: results[0].lat, lon: results[0].lon },
    {
      headers: { 'Cache-Control': 'public, s-maxage=86400' },
    }
  );
}
