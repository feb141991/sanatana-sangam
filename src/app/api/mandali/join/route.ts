import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getApiUser } from '@/lib/api-auth';

function optionalTrim(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function optionalCoordinate(value: unknown, min: number, max: number) {
  if (value == null) return undefined;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) return undefined;
  return numeric;
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
    const json = await request.json();
    const mandali_id = json.mandali_id;
    if (!mandali_id || typeof mandali_id !== 'string') {
      return NextResponse.json({ error: 'mandali_id required' }, { status: 400 });
    }

    const { user, error: authError, supabase } = await getApiUser(request);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message || 'Unauthenticated' }, { status: 401 });
    }

    const { data, error } = await supabase.rpc('join_mandali' as never, {
      p_mandali_id: mandali_id,
      p_city: optionalTrim(json.city) ?? null,
      p_country: optionalTrim(json.country) ?? null,
      p_lat: optionalCoordinate(json.latitude, -90, 90) ?? null,
      p_lon: optionalCoordinate(json.longitude, -180, 180) ?? null,
    } as never);

    if (error) {
      const status = error.code === '22023' || error.code === 'P0002' ? 400 : 500;
      console.error('[api/mandali/join]', error.code, error.message);
      return NextResponse.json({ error: status === 400 ? error.message : 'Join failed' }, { status });
    }

    return NextResponse.json({ success: true, ...(data as object) });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
