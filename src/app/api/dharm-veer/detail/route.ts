import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getDharmVeerDetail } from '@/lib/dharm-veer-db';

/** Public approved content; a missing hero returns null so 404 remains an OTA rollout signal. */
export async function GET(request: NextRequest) {
  const started = performance.now();
  const params = new URL(request.url).searchParams;
  const id = params.get('id');
  const timing = () => ({ 'Server-Timing': `detail;dur=${(performance.now() - started).toFixed(2)}` });
  if (!id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id.length > 160 || params.getAll('id').length !== 1) {
    return NextResponse.json({ error: 'Invalid hero ID.' }, { status: 400, headers: { ...timing(), 'Cache-Control': 'no-store' } });
  }
  try {
    const supabase = await createServerSupabaseClient();
    const hero = await getDharmVeerDetail(supabase, id);
    return NextResponse.json({ hero }, { headers: {
      ...timing(), 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    } });
  } catch {
    return NextResponse.json({ error: 'Story temporarily unavailable.' },
      { status: 503, headers: { ...timing(), 'Cache-Control': 'no-store', 'Retry-After': '5' } });
  }
}
