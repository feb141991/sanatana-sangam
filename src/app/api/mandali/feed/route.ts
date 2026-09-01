import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { loadMandaliDataForUser, loadMandaliFeedPage } from '@/lib/mandali-data-server';

export async function GET(request: NextRequest) {
  const startedAt = performance.now();
  const authStartedAt = performance.now();
  const { user } = await getApiUser(request);
  const authMs = performance.now() - authStartedAt;
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      {
        status: 401,
        headers: {
          'Cache-Control': 'private, no-store',
          'Server-Timing': `auth;dur=${authMs.toFixed(2)}, total;dur=${(performance.now() - startedAt).toFixed(2)}`,
        },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const limitParam = searchParams.get('limit');

  try {
    const feedStartedAt = performance.now();
    let payload;
    // The keyset-paginated, bounded-payload contract is opt-in: a caller
    // must explicitly pass ?cursor or ?limit to get it. The web app's
    // default (no-params) call keeps getting the legacy full shape from
    // loadMandaliDataForUser unchanged -- this endpoint is already live
    // there (useMandaliQuery), so its default response shape can't change
    // out from under it. Native is the first adopter of the paginated path.
    if (cursor !== null || limitParam !== null) {
      const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
      payload = await loadMandaliFeedPage(user.id, {
        cursor,
        limit: Number.isFinite(limit) ? limit : undefined,
      });
    } else {
      payload = await loadMandaliDataForUser(user.id);
    }
    const feedMs = performance.now() - feedStartedAt;
    const totalMs = performance.now() - startedAt;
    if (totalMs >= 1_000) {
      console.warn('[mandali/feed][performance]', JSON.stringify({
        authMs: Math.round(authMs * 100) / 100,
        feedMs: Math.round(feedMs * 100) / 100,
        totalMs: Math.round(totalMs * 100) / 100,
        mode: cursor !== null || limitParam !== null ? 'keyset' : 'legacy',
        release: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
      }));
    }
    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'private, no-store',
        'Server-Timing': `auth;dur=${authMs.toFixed(2)}, feed;dur=${feedMs.toFixed(2)}, total;dur=${totalMs.toFixed(2)}`,
      },
    });
  } catch (error) {
    console.error('[mandali/feed] failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json(
      { error: 'Could not load Mandali.' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'private, no-store',
          'Server-Timing': `auth;dur=${authMs.toFixed(2)}, total;dur=${(performance.now() - startedAt).toFixed(2)}`,
        },
      },
    );
  }
}
