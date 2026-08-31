import { NextRequest, NextResponse } from 'next/server';

import { getApiUser } from '@/lib/api-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (!user || !supabase) {
    return NextResponse.json({ error: authError?.message ?? 'Unauthenticated' }, { status: 401 });
  }

  const { data, error } = await supabase.rpc('get_japa_context' as never);
  if (error) {
    console.error('[api/japa/context]', error.code, error.message);
    return NextResponse.json({ error: 'Could not load Japa context' }, { status: 500 });
  }

  return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
}
