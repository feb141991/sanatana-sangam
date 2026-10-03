import { NextResponse } from 'next/server';

/** Legacy endpoint retained so previously installed clients fail safely. */
export async function GET() {
  return NextResponse.json({ error: 'Paid plans are not available.' }, { status: 410 });
}
