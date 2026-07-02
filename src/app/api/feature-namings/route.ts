import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── /api/feature-namings ──────────────────────────────────────────────────
// GET  — returns all public feature namings (for the landing page wall)
// POST — admin-only: record a new naming (requires ADMIN_SECRET header)
// ──────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic';

// biome-ignore lint: untyped DB schema
let _sb: ReturnType<typeof createClient<any>> | undefined;
function db() {
  return (_sb ??= createClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  ));
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Secret',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// ── GET — public list ──────────────────────────────────────────────────────
export async function GET() {
  const { data, error } = await db()
    .from('feature_namings')
    .select('feature_slug, feature_name, feature_category, feature_desc, sthapaka_number, named_by, tradition, named_on')
    .eq('is_public', true)
    .order('sthapaka_number', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  }
  return NextResponse.json({ namings: data ?? [] }, { headers: CORS });
}

// ── POST — admin: record a naming ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Gate: admin secret
  const secret = req.headers.get('x-admin-secret');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: CORS });
  }

  try {
    const body = await req.json();
    const {
      feature_slug, feature_name, feature_category = 'feature',
      feature_desc, sthapaka_number, named_by, tradition,
    } = body;

    if (!feature_slug || !feature_name || !sthapaka_number || !named_by) {
      return NextResponse.json(
        { error: 'feature_slug, feature_name, sthapaka_number, named_by are required.' },
        { status: 400, headers: CORS }
      );
    }
    if (sthapaka_number < 1 || sthapaka_number > 100) {
      return NextResponse.json(
        { error: 'Feature naming rights are for founding members #1–#100 only.' },
        { status: 400, headers: CORS }
      );
    }

    const { data, error } = await db()
      .from('feature_namings')
      .upsert({
        feature_slug,
        feature_name,
        feature_category,
        feature_desc: feature_desc ?? null,
        sthapaka_number,
        named_by,
        tradition: tradition ?? null,
        is_public: true,
      }, { onConflict: 'feature_slug' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, naming: data }, { headers: CORS });
  } catch (err: unknown) {
    console.error('[feature-namings] POST error:', err);
    return NextResponse.json({ error: 'Failed to record naming.' }, { status: 500, headers: CORS });
  }
}
