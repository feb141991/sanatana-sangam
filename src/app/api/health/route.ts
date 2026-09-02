import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Public liveness probe. It deliberately avoids database work. */
export async function GET() {
  return NextResponse.json(
    { status: 'ok' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
