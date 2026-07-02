import { NextResponse } from 'next/server';

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
