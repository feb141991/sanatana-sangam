// ─── Overpass API — Free sacred places data from OpenStreetMap ─────────────
// Covers Hindu mandirs, Sikh gurudwaras, Buddhist viharas, Jain temples
// All endpoints and timeouts are centralised in @/lib/config.ts

import { API } from '@/lib/config';

export interface Temple {
  id:          number;
  lat:         number;
  lon:         number;
  name:        string;
  tradition:   'hindu' | 'sikh' | 'buddhist' | 'jain' | 'other';
  deity?:      string;
  address?:    string;
  website?:    string;
  phone?:      string;
  opening?:    string;
  sampradaya?: string;
}

// ── Tradition config ────────────────────────────────────────────────────────
const TRADITION_RELIGION_MAP: Record<string, Temple['tradition']> = {
  hindu:    'hindu',
  sikh:     'sikh',
  buddhist: 'buddhist',
  jain:     'jain',
};

const TRADITION_DEFAULT_NAMES: Record<Temple['tradition'], string> = {
  hindu:    'Hindu Mandir',
  sikh:     'Gurudwara',
  buddhist: 'Buddhist Vihara',
  jain:     'Jain Temple',
  other:    'Place of Worship',
};

function inferTradition(tags: Record<string, string | undefined>): Temple['tradition'] {
  const religion = tags?.religion?.toLowerCase() ?? '';
  if (religion.includes('sikh')) return 'sikh';
  if (religion.includes('buddh')) return 'buddhist';
  if (religion.includes('jain')) return 'jain';
  if (religion.includes('hindu')) return 'hindu';
  if (religion && TRADITION_RELIGION_MAP[religion]) {
    return TRADITION_RELIGION_MAP[religion];
  }

  const combined = [
    tags?.name,
    tags?.['name:en'],
    tags?.['name:hi'],
    tags?.['name:pa'],
    tags?.denomination,
    tags?.deity,
    tags?.['hindu:deity'],
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (
    combined.includes('gurudwara')
    || combined.includes('gurdwara')
    || combined.includes('gurudvara')
    || combined.includes('darbar sahib')
    || combined.includes('gurudwara sahib')
    || combined.includes('guru nanak')
    || combined.includes('singh sabha')
    || combined.includes('khalsa')
  ) {
    return 'sikh';
  }
  if (combined.includes('vihara') || combined.includes('buddh') || combined.includes('stupa')) {
    return 'buddhist';
  }
  if (combined.includes('jain') || combined.includes('derasar') || combined.includes('jin')) {
    return 'jain';
  }
  if (combined.includes('mandir') || combined.includes('temple') || combined.includes('shiv') || combined.includes('krishna') || combined.includes('ram')) {
    return 'hindu';
  }

  return 'other';
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchNearbyTemples(
  lat: number,
  lon: number,
  radiusMetres: number = API.OVERPASS.DEFAULT_RADIUS_M
): Promise<Temple[]> {
  // Fetch all Sanatan traditions in a single query
  const query = `
    [out:json][timeout:${API.OVERPASS.QUERY_TIMEOUT_S}];
    (
      node["amenity"="place_of_worship"]["religion"="hindu"](around:${radiusMetres},${lat},${lon});
      way["amenity"="place_of_worship"]["religion"="hindu"](around:${radiusMetres},${lat},${lon});
      node["amenity"="place_of_worship"]["religion"="sikh"](around:${radiusMetres},${lat},${lon});
      way["amenity"="place_of_worship"]["religion"="sikh"](around:${radiusMetres},${lat},${lon});
      node["amenity"="place_of_worship"]["religion"="buddhist"](around:${radiusMetres},${lat},${lon});
      way["amenity"="place_of_worship"]["religion"="buddhist"](around:${radiusMetres},${lat},${lon});
      node["amenity"="place_of_worship"]["religion"="jain"](around:${radiusMetres},${lat},${lon});
      way["amenity"="place_of_worship"]["religion"="jain"](around:${radiusMetres},${lat},${lon});
      relation["amenity"="place_of_worship"]["religion"~"hindu|sikh|buddhist|jain"](around:${radiusMetres},${lat},${lon});
    );
    out center tags;
  `;

  const options: RequestInit = {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    `data=${encodeURIComponent(query)}`,
  };

  let lastError: Error = new Error('All Overpass endpoints failed');

  // Try each mirror in sequence until one works
  for (const endpoint of API.OVERPASS.MIRRORS) {
    try {
      const res = await fetchWithTimeout(endpoint, options, API.OVERPASS.FETCH_TIMEOUT_MS);
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} from ${endpoint}`);
        continue;
      }
      const json = await res.json();

      return (json.elements as any[]).map((el) => {
        const tradition = inferTradition(el.tags ?? {});
        const defaultName = TRADITION_DEFAULT_NAMES[tradition];

        return {
          id:         el.id,
          lat:        el.lat ?? el.center?.lat ?? 0,
          lon:        el.lon ?? el.center?.lon ?? 0,
          tradition,
          name:       el.tags?.name || el.tags?.['name:en'] || el.tags?.['name:hi'] ||
                      el.tags?.['name:pa'] || el.tags?.['name:sa'] || defaultName,
          deity:      el.tags?.['hindu:deity'] || el.tags?.deity,
          address:    [el.tags?.['addr:housenumber'], el.tags?.['addr:street'], el.tags?.['addr:city']]
                        .filter(Boolean).join(', ') || undefined,
          website:    el.tags?.website,
          phone:      el.tags?.phone,
          opening:    el.tags?.opening_hours,
          sampradaya: el.tags?.denomination,
        };
      }).filter((t) => t.lat !== 0);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      continue; // AbortError = timed out — try next mirror
    }
  }

  throw lastError;
}

// Geocode a city name to lat/lon using Nominatim
export async function geocodeCity(city: string, country: string): Promise<{ lat: number; lon: number } | null> {
  const q = country ? `${city}, ${country}` : city;
  try {
    const res = await fetchWithTimeout(
      `${API.NOMINATIM.SEARCH}?q=${encodeURIComponent(q)}&format=json&limit=1`,
      { headers: { 'User-Agent': API.NOMINATIM.USER_AGENT, 'Accept-Language': 'en' } },
      API.NOMINATIM.TIMEOUT_MS
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
