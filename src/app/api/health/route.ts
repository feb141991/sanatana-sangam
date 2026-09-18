import { NextResponse } from 'next/server';

// Edge, not Node: this route touches nothing Node-specific, and running it on
// Vercel's Edge Network means it executes at whichever PoP is nearest the
// caller instead of being routed to the single Node region in vercel.json
// (dub1/Dublin) -- that single-region pin is what made this trivial route
// measure 1000ms+ from non-European callers despite doing zero work.
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/** Public liveness probe. It deliberately avoids database work. */
export async function GET() {
  return NextResponse.json(
    { status: 'ok' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
