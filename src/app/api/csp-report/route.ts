import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const report = await req.json();
    console.warn('CSP Violation:', report);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process CSP report' }, { status: 400 });
  }
}
