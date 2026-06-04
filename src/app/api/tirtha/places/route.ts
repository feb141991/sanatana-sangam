import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { API } from '@/lib/config';
import { getCuratedNearbyTemples } from '@/lib/diaspora-temples';

export const maxDuration = 30;

const DHARMIC_RELIGIONS = new Set(['hindu', 'sikh', 'buddhist', 'jain']);

function bucket(v: number, step = 0.01) {
  return Math.round(v / step) * step;
}

function stableId(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
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

// ── Geoapify Places API (primary) ───────────────────────────────────────────
async function fetchFromGeoapify(lat: number, lon: number, radiusM: number): Promise<any[]> {
  const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
  if (!apiKey) return [];

  const url = `https://api.geoapify.com/v2/places?categories=religion.place_of_worship&filter=circle:${lon},${lat},${radiusM}&limit=100&apiKey=${apiKey}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];
    const data = await res.json() as { features?: any[] };

    return (data.features ?? [])
      .map((f: any) => {
        const p = f.properties ?? {};
        const raw = p.datasource?.raw ?? {};
        const religion = (raw.religion ?? '').toLowerCase();
        const coords = f.geometry?.coordinates ?? [];
        return {
          _religion: religion,
          id: stableId(p.place_id ?? `${p.lat ?? coords[1]},${p.lon ?? coords[0]}`),
          lat: p.lat ?? coords[1] ?? 0,
          lon: p.lon ?? coords[0] ?? 0,
          tags: {
            name:             p.name,
            religion,
            'addr:housenumber': raw['addr:housenumber'],
            'addr:street':      raw['addr:street'],
            'addr:city':        p.city ?? raw['addr:city'],
            website:            raw.website,
            phone:              raw.phone,
            opening_hours:      raw.opening_hours,
            deity:              raw['hindu:deity'] ?? raw.deity,
            denomination:       raw.denomination,
          },
        };
      })
      .filter((e: any) => DHARMIC_RELIGIONS.has(e._religion) && e.lat !== 0);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// ── Overpass (fallback) ──────────────────────────────────────────────────────
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

  for (const mirror of API.OVERPASS.MIRRORS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    try {
      const res = await fetch(mirror, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      if (!res.ok) continue;
      const json = await res.json() as { elements?: any[] };
      return json.elements ?? [];
    } catch {
      // try next mirror
    } finally {
      clearTimeout(timer);
    }
  }
  return [];
}

// ── Curated (always instant) ─────────────────────────────────────────────────
function getCuratedElements(lat: number, lon: number, radiusM: number) {
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
  }));
}

// ── Cache wrapper (6 hours per bucketed location) ────────────────────────────
function getCachedElements(latB: number, lonB: number, radiusM: number) {
  return unstable_cache(
    async () => {
      // Try Geoapify first — fast and reliable with our API key
      const geo = await fetchFromGeoapify(latB, lonB, radiusM);
      if (geo.length > 0) return { elements: geo, source: 'geoapify' };

      // Fallback to Overpass if Geoapify returns nothing (key missing, quota hit)
      const osm = await fetchFromOverpass(latB, lonB, radiusM);
      return { elements: osm, source: 'overpass' };
    },
    [`tirtha-places-${latB}-${lonB}-${radiusM}`],
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

  // Curated: always instant, always available
  const curated = getCuratedElements(lat, lon, radiusM);

  // Geoapify → Overpass: cached 6 hours, graceful empty on failure
  const latB = bucket(lat);
  const lonB = bucket(lon);
  let fetched: any[] = [];
  let source = 'curated';
  try {
    const result = await getCachedElements(latB, lonB, radiusM);
    fetched = result.elements;
    source = result.source;
  } catch {
    // all remote sources failed — curated covers the gap
  }

  // Drop remote results within 250m of a curated temple to avoid duplicates
  const dedupedRemote = fetched.filter((r) => {
    const rLat = r.lat ?? r.center?.lat ?? 0;
    const rLon = r.lon ?? r.center?.lon ?? 0;
    return !curated.some((c) => haversineKm(c.lat, c.lon, rLat, rLon) < DEDUP_KM);
  });

  const elements = [...curated, ...dedupedRemote];

  return NextResponse.json(
    { elements, source: curated.length > 0 ? `${source}+curated` : source },
    { headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600' } }
  );
}
