import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/lib/config';

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lon = req.nextUrl.searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
  }

  const latitude = Number(lat);
  const longitude = Number(lon);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json({ error: 'lat and lon must be valid coordinates' }, { status: 400 });
  }

  const url = new URL(API.NOMINATIM.REVERSE);
  url.search = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: 'json',
  }).toString();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API.NOMINATIM.TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': API.NOMINATIM.USER_AGENT,
        'Accept-Language': 'en',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Reverse geocoding failed' }, { status: res.status });
    }

    const data = await res.json();
    const city = data.address?.city || data.address?.town || data.address?.village || '';
    const country = data.address?.country ?? '';

    return NextResponse.json({ city, country }, {
      headers: { 'Cache-Control': 'public, s-maxage=86400' },
    });
  } catch {
    return NextResponse.json({ error: 'Reverse geocoding failed' }, { status: 500 });
  } finally {
    clearTimeout(timer);
  }
}
