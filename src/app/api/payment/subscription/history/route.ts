import { NextResponse } from 'next/server';

/** Legacy endpoint retained for old clients; no subscription history is exposed. */
export async function GET() {
  return NextResponse.json({ error: 'Subscription history is not available.' }, { status: 410 });
}
