import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/lib/config';

async function geocodeWithGeoapify(q: string): Promise<{ lat: number; lon: number } | null> {
  const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
  if (!apiKey) return null;

  const url = `${API.GEOAPIFY.GEOCODE}?text=${encodeURIComponent(q)}&format=json&limit=1&apiKey=${apiKey}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API.GEOAPIFY.TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json() as { results?: Array<{ lat: number; lon: number }> };
    const first = data.results?.[0];
    if (!first) return null;
    return { lat: first.lat, lon: first.lon };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function geocodeWithNominatim(q: string): Promise<{ lat: number; lon: number } | null> {
  const url = `${API.NOMINATIM.SEARCH}?q=${encodeURIComponent(q)}&format=json&limit=1`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API.NOMINATIM.TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': API.NOMINATIM.USER_AGENT, 'Accept-Language': 'en' },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json() as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
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

  // Try Geoapify first (more accurate, especially for diaspora city names)
  const result = (await geocodeWithGeoapify(q)) ?? (await geocodeWithNominatim(q));

  if (!result) {
    return NextResponse.json({ error: `Could not find "${q}"` }, { status: 404 });
  }

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=86400' },
  });
}
