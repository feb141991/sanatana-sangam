import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { API } from '@/lib/config';
import { getCuratedNearbyTemples } from '@/lib/diaspora-temples';

// Allow up to 30 s so Overpass has a fighting chance on slow days
export const maxDuration = 30;

// Bucket coords to ~1 km grid so nearby searches share cache entries
function bucket(v: number, step = 0.01) {
  return Math.round(v / step) * step;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Curated temples converted to Overpass element shape — always instant
function getCuratedElements(lat: number, lon: number, radiusM: number) {
  const radiusKm = radiusM / 1000;
  return getCuratedNearbyTemples(lat, lon, radiusM).map((t) => ({
    id: parseInt(t.id.replace(/[^0-9]/g, '').slice(0, 8) || '0', 10),
    lat: t.lat,
    lon: t.lon,
    _curated: true,
    tags: {
      name: t.name,
      religion: t.tradition,
      'addr:city': t.city,
      website: t.website,
      opening_hours: t.opening,
      deity: t.deity,
      denomination: t.sampradaya,
    },
  })).filter((t) => haversineKm(lat, lon, t.lat, t.lon) <= radiusKm);
}

// Try each Overpass mirror with a tight per-mirror timeout
async function fetchFromOverpass(lat: number, lon: number, radiusM: number): Promise<any[]> {
  const query = `
[out:json][timeout:20];
(
  node["amenity"="place_of_worship"]["religion"="hindu"](around:${radiusM},${lat},${lon});
  way["amenity"="place_of_worship"]["religion"="hindu"](around:${radiusM},${lat},${lon});
  node["amenity"="place_of_worship"]["religion"="sikh"](around:${radiusM},${lat},${lon});
  way["amenity"="place_of_worship"]["religion"="sikh"](around:${radiusM},${lat},${lon});
  node["amenity"="place_of_worship"]["religion"="buddhist"](around:${radiusM},${lat},${lon});
  way["amenity"="place_of_worship"]["religion"="buddhist"](around:${radiusM},${lat},${lon});
  node["amenity"="place_of_worship"]["religion"="jain"](around:${radiusM},${lat},${lon});
  way["amenity"="place_of_worship"]["religion"="jain"](around:${radiusM},${lat},${lon});
);
out center tags;
  `.trim();

  const body = `data=${encodeURIComponent(query)}`;

  for (const mirror of API.OVERPASS.MIRRORS) {
    const controller = new AbortController();
    // 8 s per mirror — tight enough to try 2–3 mirrors within maxDuration
    const timer = setTimeout(() => controller.abort(), 8_000);
    try {
      const res = await fetch(mirror, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: controller.signal,
      });
      if (!res.ok) continue;
      const json = await res.json() as { elements?: any[] };
      return json.elements ?? [];
    } catch {
      // timed out or network error — try next mirror
    } finally {
      clearTimeout(timer);
    }
  }
  return []; // all mirrors failed — return empty, curated data covers the gap
}

function getCachedPlaces(latB: number, lonB: number, radiusM: number) {
  return unstable_cache(
    () => fetchFromOverpass(latB, lonB, radiusM),
    [`tirtha-osm-${latB}-${lonB}-${radiusM}`],
    { revalidate: 6 * 60 * 60, tags: ['tirtha-places'] }
  )();
}

const DEDUP_KM = 0.25;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lon = parseFloat(searchParams.get('lon') ?? '');
  const radiusM = parseInt(searchParams.get('radius') ?? String(API.OVERPASS.DEFAULT_RADIUS_M), 10);

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
  }

  // Curated temples: synchronous, always available, zero network cost
  const curated = getCuratedElements(lat, lon, radiusM);

  // OSM via Overpass: best-effort, cached 6 h, gracefully returns [] on failure
  const latB = bucket(lat);
  const lonB = bucket(lon);
  let osmElements: any[] = [];
  try {
    osmElements = await getCachedPlaces(latB, lonB, radiusM);
  } catch {
    // Overpass completely unreachable — curated data is sufficient
  }

  // Deduplicate: drop OSM entries within 250 m of a curated temple
  const dedupedOsm = osmElements.filter((osm) => {
    const osmLat = osm.lat ?? osm.center?.lat ?? 0;
    const osmLon = osm.lon ?? osm.center?.lon ?? 0;
    return !curated.some((c) => haversineKm(c.lat, c.lon, osmLat, osmLon) < DEDUP_KM);
  });

  // Curated first, OSM appended
  const elements = [...curated, ...dedupedOsm];

  return NextResponse.json({ elements, source: osmElements.length > 0 ? 'osm+curated' : 'curated' }, {
    headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600' },
  });
}
