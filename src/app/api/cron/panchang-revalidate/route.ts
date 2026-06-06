import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/panchang-revalidate
 *
 * Triggered daily at 00:01 IST (18:31 UTC) by Vercel cron.
 * Calls revalidatePath('/panchang') so Next.js regenerates the ISR page
 * immediately — ensuring it is always warm when users visit.
 *
 * Without this, the ISR regenerates lazily on the first visitor after
 * cache expiry, causing 500s+ TTFB while the serverless function cold-starts
 * and runs astronomia's heavy calendar computation.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  revalidatePath('/panchang');

  return NextResponse.json({
    revalidated: true,
    path: '/panchang',
    ts: new Date().toISOString(),
  });
}
