import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/api-auth';
import { loadMandaliDataForUser } from '@/lib/mandali-data-server';

export async function GET(request: NextRequest) {
  const { user } = await getApiUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    return NextResponse.json(await loadMandaliDataForUser(user.id));
  } catch (error) {
    console.error('[mandali/feed] failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Could not load Mandali.' }, { status: 500 });
  }
}
