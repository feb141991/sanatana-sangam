import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { verifyAdminCookieAuth } from '@/lib/admin-auth';

// Not using createAdminClient() from '@/lib/supabase-admin' here because that
// helper is typed against src/types/database.ts, which does not yet include
// the dharm_veers / dharm_veer_generation_log tables or their new
// review_status / source_backed / source_citations columns (a pre-existing
// gap noted elsewhere in this project). A plain untyped client avoids fighting
// stale generated types for a table that already tolerates this pattern
// elsewhere in the codebase (see check-live-darshans/route.ts).
function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
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

    await supabase
      .from('dharm_veer_generation_log')
      .update({ status: 'no_source_found', notes: 'Rejected by admin review; treated as unsourceable.' })
      .eq('slug', slug);

    return NextResponse.json({ ok: true, slug, action: 'reject' });
  }

  const { error } = await supabase
    .from('dharm_veers')
    .update({ review_status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('slug', slug)
    .eq('review_status', 'pending_review');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from('dharm_veer_generation_log')
    .update({ status: 'generated_approved', notes: 'Approved by admin review.' })
    .eq('slug', slug);

  return NextResponse.json({ ok: true, slug, action: 'approve' });
}
