import { NextResponse } from 'next/server';
import { CLIENT_RELEASE_IDENTITY, serverReleaseIdentity } from '@/lib/release-identity';

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
