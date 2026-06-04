import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { API } from '@/lib/config';

// Bucket coords to ~1 km grid so nearby searches share cache entries
function bucket(v: number, step = 0.01) {
  return Math.round(v / step) * step;
}

async function fetchFromOverpass(lat: number, lon: number, radiusM: number): Promise<any[]> {
  const query = `
[out:json][timeout:${API.OVERPASS.QUERY_TIMEOUT_S}];
(
  node["amenity"="place_of_worship"]["religion"="hindu"](around:${radiusM},${lat},${lon});
  way["amenity"="place_of_worship"]["religion"="hindu"](around:${radiusM},${lat},${lon});
  node["amenity"="place_of_worship"]["religion"="sikh"](around:${radiusM},${lat},${lon});
  way["amenity"="place_of_worship"]["religion"="sikh"](around:${radiusM},${lat},${lon});
  node["amenity"="place_of_worship"]["religion"="buddhist"](around:${radiusM},${lat},${lon});
  way["amenity"="place_of_worship"]["religion"="buddhist"](around:${radiusM},${lat},${lon});
  node["amenity"="place_of_worship"]["religion"="jain"](around:${radiusM},${lat},${lon});
  way["amenity"="place_of_worship"]["religion"="jain"](around:${radiusM},${lat},${lon});
  relation["amenity"="place_of_worship"]["religion"~"hindu|sikh|buddhist|jain"](around:${radiusM},${lat},${lon});
);
out center tags;
  `.trim();

  const body = `data=${encodeURIComponent(query)}`;
  const options: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  };

  let lastError: Error = new Error('All Overpass mirrors failed');

  for (const mirror of API.OVERPASS.MIRRORS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API.OVERPASS.FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(mirror, { ...options, signal: controller.signal });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} from ${mirror}`);
        continue;
      }
      const json = await res.json() as { elements?: any[] };
      return json.elements ?? [];
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}

// Cache per bucketed (lat, lon, radius) — revalidates every 6 hours.
// This means the first user in a city pays the Overpass latency;
// every subsequent user in that area gets an instant response.
function getCachedPlaces(latB: number, lonB: number, radiusM: number) {
  return unstable_cache(
    () => fetchFromOverpass(latB, lonB, radiusM),
    [`tirtha-places-${latB}-${lonB}-${radiusM}`],
    { revalidate: 6 * 60 * 60, tags: ['tirtha-places'] }
  )();
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lon = parseFloat(searchParams.get('lon') ?? '');
  const radius = parseInt(searchParams.get('radius') ?? String(API.OVERPASS.DEFAULT_RADIUS_M), 10);

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
  }

  const latB = bucket(lat);
  const lonB = bucket(lon);

  try {
    const elements = await getCachedPlaces(latB, lonB, radius);
    return NextResponse.json({ elements }, {
      headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600' },
    });
  } catch (err: any) {
    console.error('[GET /api/tirtha/places] Overpass error:', err?.message);
    return NextResponse.json(
      { error: 'Map data temporarily unavailable', elements: [] },
      { status: 503 }
    );
  }
}
