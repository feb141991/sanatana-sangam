import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { ADMIN_COOKIE, verifyAdminCookieAuth, verifyAdminToken } from '@/lib/admin-auth';

// Keep this route untyped for now. This repo's hand-written generated Database
// type still intersects some ad-hoc/admin-only table writes into `never`, while
// the service-role route itself is protected by verifyAdminCookieAuth().
function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Admin auth here is a standalone HMAC-signed cookie (src/lib/admin-auth.ts),
// deliberately independent from Supabase auth -- there is no Supabase
// auth.users row for the admin, so `reviewed_by` (a uuid FK to auth.users)
// genuinely cannot be populated from this session. This at least records
// *which* admin username approved/rejected in the generation_log notes,
// which is more auditable than nothing. verifyAdminCookieAuth() already
// validated this same cookie moments earlier, so this is a cheap re-verify,
// not a second trust decision.
async function getAdminUsername(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value ?? '';
  const result = await verifyAdminToken(token);
  return result?.username ?? null;
}

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const supabase = adminSupabase();

  const { data, error } = await supabase
    .from('dharm_veers')
    .select(
      'slug, name, name_local, tradition, era, tagline, journey, journey_local, trial, teaching, moral, legacy, quote, quote_source, source_citations, generated_by, created_at',
    )
    .eq('review_status', 'pending_review')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const slug = body?.slug;
  const action = body?.action;

  if (!slug || (action !== 'approve' && action !== 'reject')) {
    return NextResponse.json(
      { error: 'Body must include { slug: string, action: "approve" | "reject" }' },
      { status: 400 },
    );
  }

  const supabase = adminSupabase();

  if (action === 'reject') {
    // Delete the row outright rather than leaving a permanently-rejected
    // AI-generated biography sitting in the canonical dharm_veers table.
    // The generation_log entry (status: generated_pending_review, written by
    // the cron) stays as-is, so this slug will not be re-attempted --
    // rejection is a final human decision, not a "try again" signal.
    const { error } = await supabase.from('dharm_veers').delete().eq('slug', slug).eq('review_status', 'pending_review');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rejectedBy = await getAdminUsername(request);
    await supabase
      .from('dharm_veer_generation_log')
      .update({
        status: 'no_source_found',
        notes: `Rejected by admin review (${rejectedBy ?? 'unknown admin'}); treated as unsourceable.`,
      })
      .eq('slug', slug);

    return NextResponse.json({ ok: true, slug, action: 'reject' });
  }

  const { error } = await supabase
    .from('dharm_veers')
    .update({ review_status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('slug', slug)
    .eq('review_status', 'pending_review');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const approvedBy = await getAdminUsername(request);
  await supabase
    .from('dharm_veer_generation_log')
    .update({
      status: 'generated_approved',
      notes: `Approved by admin review (${approvedBy ?? 'unknown admin'}).`,
    })
    .eq('slug', slug);

  return NextResponse.json({ ok: true, slug, action: 'approve' });
}
