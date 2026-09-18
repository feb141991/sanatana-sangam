import { NextResponse } from 'next/server';
import { getPublicSourceDisclosures } from '@/lib/public-source-disclosures';

// Pure static-data transform, no DB/Node dependency -- runs at the nearest
// edge PoP instead of being routed to the single Node region (dub1).
export const runtime = 'edge';
export const revalidate = 86_400;

export async function GET() {
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    sources: getPublicSourceDisclosures(),
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
  });
}
