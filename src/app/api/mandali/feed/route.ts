import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { loadMandaliDataForUser, loadMandaliFeedPage } from '@/lib/mandali-data-server';

export async function GET(request: NextRequest) {
  const { user } = await getApiUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const limitParam = searchParams.get('limit');

  try {
    // The keyset-paginated, bounded-payload contract is opt-in: a caller
    // must explicitly pass ?cursor or ?limit to get it. The web app's
    // default (no-params) call keeps getting the legacy full shape from
    // loadMandaliDataForUser unchanged -- this endpoint is already live
    // there (useMandaliQuery), so its default response shape can't change
    // out from under it. Native is the first adopter of the paginated path.
    if (cursor !== null || limitParam !== null) {
      const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
      return NextResponse.json(
        await loadMandaliFeedPage(user.id, { cursor, limit: Number.isFinite(limit) ? limit : undefined })
      );
    }
    return NextResponse.json(await loadMandaliDataForUser(user.id));
  } catch (error) {
    console.error('[mandali/feed] failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Could not load Mandali.' }, { status: 500 });
  }
}
