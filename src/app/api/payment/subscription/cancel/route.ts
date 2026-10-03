import { NextResponse } from 'next/server';

/** Legacy endpoint retained for old clients; no subscription provider is active. */
export async function POST() {
  return NextResponse.json({ error: 'Subscription management is not available.' }, { status: 410 });
}
