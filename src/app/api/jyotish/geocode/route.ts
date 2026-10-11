/**
 * GET /api/jyotish/geocode?q=Mumbai
 * Returns lat, lng, timezone (IANA), city, country for the given query.
 * Responses cached at CDN edge for 24h (city coordinates don't change).
 */

import { NextRequest, NextResponse } from 'next/server';
import { geocodeCity, timezoneFromCoordinates } from '@/lib/jyotish/geocode';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: 'Query param `q` is required (min 2 chars)' },
      { status: 400 }
    );
  }

  try {
    const result = await geocodeCity(q);
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Geocoding failed';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function POST(req: NextRequest) {
  const noStoreHeaders = { 'Cache-Control': 'private, no-store' };
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Valid coordinate JSON is required' }, { status: 400, headers: noStoreHeaders });
  }

  const lat = body && typeof body === 'object' ? (body as { lat?: unknown }).lat : undefined;
  const lng = body && typeof body === 'object' ? (body as { lng?: unknown }).lng : undefined;
  if (typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90
    || typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return NextResponse.json({ error: 'Valid lat and lng coordinates are required' }, { status: 400, headers: noStoreHeaders });
  }

  try {
    const timezone = timezoneFromCoordinates(lat, lng);
    if (!timezone) {
      return NextResponse.json({ error: 'Could not resolve a timezone for these coordinates' }, {
        status: 422,
        headers: noStoreHeaders,
      });
    }
    return NextResponse.json({ timezone }, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json({ error: 'Could not resolve the selected coordinates' }, {
      status: 503,
      headers: noStoreHeaders,
    });
  }
}
