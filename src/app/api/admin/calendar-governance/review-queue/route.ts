import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { ADMIN_COOKIE, verifyAdminCookieAuth, verifyAdminToken } from '@/lib/admin-auth';

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function getAdminUsername(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value ?? '';
  const result = await verifyAdminToken(token);
  return result?.username ?? null;
}

// GET /api/admin/calendar-governance/review-queue
// Reads observance_review_queue directly -- no new table needed, this one
// already carries everything the admin GUI needs (spiritual_tradition,
// variant_key, source_refs, review_status + the terminal-state-protecting
// trigger from the review_queue_variant_identity migration).
export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const supabase = adminSupabase();
  const { data, error } = await supabase
    .from('observance_review_queue')
    .select(
      'id, definition_id, year, calendar_profile, location_label, ambiguity_type, ' +
      'spiritual_tradition, variant_key, reasoning, candidate_dates, source_refs, ' +
      'review_status, reviewed_by, reviewed_at, review_notes, created_at, ' +
      'observance_definitions(slug, display_name)',
    )
    .order('year', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/admin/calendar-governance/review-queue
// Body: { id: string, action: 'approve' | 'reject', notes?: string }
//
// This only ever changes review_status/reviewed_by/reviewed_at/review_notes --
// never candidate_dates or the disputed item's own identity. The DB trigger
// (trg_preserve_review_queue_terminal_state) already protects an approved/
// rejected row from being silently reset by the next materialiser rerun, so
// this action is a real, durable decision, not one that gets clobbered.
export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const id = body?.id;
  const action = body?.action;

  if (!id || (action !== 'approve' && action !== 'reject')) {
    return NextResponse.json(
      { error: 'Body must include { id: string, action: "approve" | "reject" }' },
      { status: 400 },
    );
  }

  const supabase = adminSupabase();
  const adminUsername = await getAdminUsername(request);

  // reviewed_by is a uuid FK (to auth.users), and there is no auth.users row
  // for the HMAC-cookie admin session -- same constraint as dharm-veer-review.
  // Writing the username there fails with a Postgres type error; the name
  // goes into review_notes instead, same fallback that precedent already uses.
  const { error } = await supabase
    .from('observance_review_queue')
    .update({
      review_status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_by: null,
      reviewed_at: new Date().toISOString(),
      review_notes: `${action === 'approve' ? 'Approved' : 'Rejected'} by ${adminUsername ?? 'unknown admin'}.${body?.notes ? ` ${body.notes}` : ''}`,
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id, action });
}
