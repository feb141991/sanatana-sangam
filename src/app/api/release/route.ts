import { NextResponse } from 'next/server';
import { CLIENT_RELEASE_IDENTITY, serverReleaseIdentity } from '@/lib/release-identity';

// Pure process.env reads, no DB/Node dependency -- runs at the nearest edge
// PoP instead of being routed to the single Node region (dub1) for every call.
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      client: CLIENT_RELEASE_IDENTITY,
      server: serverReleaseIdentity(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
