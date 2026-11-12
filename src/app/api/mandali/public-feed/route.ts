import { NextRequest, NextResponse } from 'next/server';
import { rateLimitByIp } from '@/lib/api-security';
import { loadPublicMandaliFeedPage, PublicFeedCursorError } from '@/lib/mandali-public-feed';

export const dynamic = 'force-dynamic';

/**
 * Read-only Mandali posts for a signed-out person in the app. No account is needed and none is read: the answer is the same
 * for everyone, so it may be cached briefly. Everything a person can DO (react, comment, vote, RSVP, post, report) stays on
 * the signed-in routes. See src/lib/mandali-public-feed.ts for exactly what is and is not included.
 */
export async function GET(request: NextRequest) {
  const limited = rateLimitByIp(request, { keyPrefix: 'mandali-public-feed', limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const limitParam = searchParams.get('limit');
  const limit = limitParam === null ? undefined : Number.parseInt(limitParam, 10);

  try {
    const page = await loadPublicMandaliFeedPage({ cursor, limit: Number.isFinite(limit) ? limit : undefined });
    return NextResponse.json(page, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=30' },
    });
  } catch (error) {
    if (error instanceof PublicFeedCursorError) {
      return NextResponse.json({ error: 'Invalid cursor', code: 'INVALID_VALUE' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }
    console.error('[mandali/public-feed] failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Could not load Mandali.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
