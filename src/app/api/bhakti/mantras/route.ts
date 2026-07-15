import { NextRequest, NextResponse } from 'next/server';
import { MANTRAS } from '@/data/mantras';

/**
 * GET /api/bhakti/mantras?tradition=hindu
 *
 * Public, read-only endpoint — no auth required. Backs the native Bhakti
 * "Mantras" screen (Phase 7), mirroring the PWA's
 * src/app/(main)/mantras/MantrasClient.tsx tab filter (All/Tradition/
 * Others) by returning the full list with each mantra's `tradition` field
 * intact — native applies the same client-side tab filter PWA does, so no
 * `tradition` query param is required, but it's accepted for symmetry with
 * the other Bhakti content routes.
 *
 * `isPremium` is returned as-is (not gated server-side) — same as PWA,
 * which shows all mantras but locks premium ones behind a paywall nudge on
 * tap rather than hiding them from the list.
 */
export async function GET(req: NextRequest) {
  const tradition = req.nextUrl.searchParams.get('tradition');

  const mantras = tradition && tradition !== 'all'
    ? MANTRAS.filter((m) => m.tradition === tradition || m.tradition === 'all')
    : MANTRAS;

  return NextResponse.json(
    { mantras, total: mantras.length },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}
