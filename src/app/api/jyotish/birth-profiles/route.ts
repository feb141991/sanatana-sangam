/**
 * GET  /api/jyotish/birth-profiles          — list all profiles for auth user
 * POST /api/jyotish/birth-profiles/claim    — claim guest profiles on signup
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAuthUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet: any) {
            try {
              cookiesToSet.forEach(({ name, value, options }: any) =>
                cookieStore.set(name, value, options)
              );
            } catch { /* server component */ }
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// ── GET — list user's birth profiles ─────────────────────────────────────────
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getServiceClient();
  const { data, error } = await db
    .from('birth_profiles')
    .select(`
      id, label, full_name, relation,
      date_of_birth, time_of_birth,
      birth_city, birth_country, birth_timezone,
      rashi, sun_rashi, nakshatra, nakshatra_pada, nakshatra_lord,
      lagna, lagna_deg,
      current_dasha_planet, current_dasha_end_date, next_dasha_planet,
      is_primary, is_public,
      created_at, updated_at
    `)
    .eq('owner_id', userId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profiles: data });
}

// ── POST — claim guest profiles on signup ─────────────────────────────────────
// Body: { session_token: string }
export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { session_token?: string } = {};
  try { body = await req.json(); } catch { /* ok */ }

  const { session_token } = body;
  if (!session_token) {
    return NextResponse.json({ error: 'session_token required' }, { status: 400 });
  }

  const db = getServiceClient();

  // Claim all guest profiles with this session token
  const { data, error } = await db
    .from('birth_profiles')
    .update({ owner_id: userId, session_token: null })
    .eq('session_token', session_token)
    .is('owner_id', null)
    .select('id, label');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    claimed: data?.length ?? 0,
    profiles: data,
  });
}
