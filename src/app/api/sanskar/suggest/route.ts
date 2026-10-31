import { NextResponse } from 'next/server';

/**
 * Retired legacy route.
 * Sanskara lifecycle suggestions are superseded by the Sanskara Tracker architecture
 * (see docs/SANSKARA_TRACKER_BACKEND_DESIGN.md and R6: no sanskara data reaches an LLM).
 */
export async function POST() {
  return NextResponse.json(
    {
      code: 'ROUTE_DEPRECATED',
      message: 'This legacy sanskara suggestion route has been retired.',
    },
    { status: 410 },
  );
}
