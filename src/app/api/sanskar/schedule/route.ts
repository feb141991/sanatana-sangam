import { NextResponse } from 'next/server';

/**
 * Retired legacy route.
 * Sanskara scheduling is superseded by the Sanskara Tracker architecture
 * and canonical notification candidate pipelines.
 * (see docs/SANSKARA_TRACKER_BACKEND_DESIGN.md).
 */
export async function POST() {
  return NextResponse.json(
    {
      code: 'ROUTE_DEPRECATED',
      message: 'This legacy sanskara schedule route has been retired.',
    },
    { status: 410 },
  );
}
