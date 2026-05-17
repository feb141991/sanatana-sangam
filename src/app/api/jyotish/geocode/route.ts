/**
 * GET /api/jyotish/geocode?q=Mumbai
 * Returns lat, lng, timezone (IANA), city, country for the given query.
 * Responses cached at CDN edge for 24h (city coordinates don't change).
 */

import { NextRequest, NextResponse } from 'next/server';
import { geocodeCity } from '@/lib/jyotish/geocode';

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
