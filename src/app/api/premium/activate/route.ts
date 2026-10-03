import { NextResponse } from 'next/server';

/** Legacy endpoint retained only so old app versions fail safely. */
export async function POST() {
  return NextResponse.json(
    { error: 'Paid plans are not available.' },
    { status: 410 },
  );
}
