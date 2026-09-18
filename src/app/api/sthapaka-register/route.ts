import { NextResponse } from 'next/server';

// Static retired-flow response, no DB/Node dependency -- runs at the nearest
// edge PoP instead of being routed to the single Node region (dub1).
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    {
      error: 'retired_flow',
      message: 'This registration flow has moved. Please create your account from /signup.',
    },
    { status: 410 }
  );
}
