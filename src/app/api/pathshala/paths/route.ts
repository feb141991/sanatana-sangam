import { NextResponse } from 'next/server';
import { SEED_PATHS } from '@/lib/pathshala-paths';

// Pure static-data return, no DB/Node dependency -- runs at the nearest edge
// PoP instead of being routed to the single Node region (dub1) for every call.
export const runtime = 'edge';

export async function GET() {
  return NextResponse.json(
    { paths: SEED_PATHS },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}
