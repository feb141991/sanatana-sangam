import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getApiUser } from '@/lib/api-auth';

function optionalTrim(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function optionalCoordinate(value: unknown, min: number, max: number) {
  if (value == null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error('Invalid coordinates');
  return value;
}

// Delegates entirely to join_mandali() (supabase/migrations/20260906002021_
// repair_mandali_join_privilege_and_member_count.sql) via the caller's own
// authenticated client -- no admin client needed here anymore. The
// function derives identity from auth.uid() internally, checks is_banned,
// validates the target/coordinates, and updates member_count correctly
// under its own SECURITY DEFINER context, so this route no longer needs
// to duplicate any of that logic (previously: a manual assertNotBanned
// call plus a raw, unasserted profiles update via the admin client).
export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => null);
    if (!json || typeof json !== 'object' || Array.isArray(json)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    const mandali_id = json.mandali_id;
    if (!mandali_id || typeof mandali_id !== 'string') {
      return NextResponse.json({ error: 'mandali_id required' }, { status: 400 });
    }
    let latitude: number | undefined;
    let longitude: number | undefined;
    try {
      latitude = optionalCoordinate(json.latitude, -90, 90);
      longitude = optionalCoordinate(json.longitude, -180, 180);
      if ((latitude === undefined) !== (longitude === undefined)) throw new Error('Incomplete coordinates');
    } catch {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const { user, error: authError, supabase } = await getApiUser(request);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message || 'Unauthenticated' }, { status: 401 });
    }

    const { data, error } = await supabase.rpc('join_mandali' as never, {
      p_mandali_id: mandali_id,
      p_city: optionalTrim(json.city) ?? null,
      p_country: optionalTrim(json.country) ?? null,
      p_lat: latitude ?? null,
      p_lon: longitude ?? null,
    } as never);

    if (error) {
      const status = error.code === '28000' ? 403 : error.code === '22023' || error.code === '22P02' || error.code === 'P0002' ? 400 : 500;
      console.error('[api/mandali/join]', error.code, error.message);
      return NextResponse.json({ error: status === 400 ? error.message : 'Join failed' }, { status });
    }

    if (!data || typeof data !== 'object' || typeof data.mandaliId !== 'string' || !data.mandaliId) {
      return NextResponse.json({ error: 'Membership was not confirmed' }, { status: 502 });
    }
    return NextResponse.json({ success: true, ...data });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
