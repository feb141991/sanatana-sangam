import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { ADMIN_COOKIE, verifyAdminCookieAuth, verifyAdminToken } from '@/lib/admin-auth';
import { computeEngineHint } from '@/lib/calendar/fixture-engine-hint';

// Untyped for the same reason as dharm-veer-review: golden_fixtures is a new
// table this repo's hand-written Database type doesn't model yet, and the
// route is already protected by verifyAdminCookieAuth().
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

// GET /api/admin/calendar-governance/fixtures
// Returns every golden_fixtures row, each enriched with tradition/kind/
// rule_family/launch_status from CANONICAL_RULES (same join the /coverage
// route already uses). Filtering happens client-side — 219 rows, cheap.
export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  // In-memory join against rules.json — canonical_rules is a JSON file,
  // not a DB table; Supabase can't join it.
  const { CANONICAL_RULES } = await import('@/lib/calendar/rules');
  const rulesBySlug = new Map(CANONICAL_RULES.map(r => [r.slug, r]));

  const supabase = adminSupabase();
  const { data, error } = await supabase
    .from('golden_fixtures')
    .select('*')
    .order('festival_id', { ascending: true })
    .order('year', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich each row with rule-level facets so the client can group/filter
  // without a second fetch. Rows whose festival_id has no matching rule
  // (shouldn't happen in practice) get sentinel values so rendering never crashes.
  //
  // engineHint is a read-only convenience so a reviewer can see what the
  // engine currently computes right next to the (possibly still-TODO)
  // sourced `expected` date, without running the engine by hand -- see
  // fixture-engine-hint.ts for why this can never become `expected` itself.
  const enriched = (data ?? []).map(row => {
    const rule = rulesBySlug.get(row.festival_id as string);
    const profile = row.profile as { tradition?: string } | null;
    const variantKey = profile?.tradition && profile.tradition !== 'unspecified' ? profile.tradition : null;
    return {
      ...row,
      tradition:    rule?.tradition    ?? 'unknown',
      kind:         rule?.kind         ?? 'unknown',
      rule_family:  rule?.rule_family  ?? 'unknown',
      launch_status: rule?.launch_status ?? 'included',
      engineHint: computeEngineHint(row.festival_id as string, row.year as number, variantKey),
    };
  });

  return NextResponse.json(enriched);
}

// POST /api/admin/calendar-governance/fixtures
// Body: { caseId: string, action: 'approve' | 'reject' | 'update', patch?: {...} }
//
// 'approve'/'reject' only ever touch approval-workflow columns
// (approved/reviewed_by/reviewed_at/review_notes) -- never expected/source/
// reasoning, so a reviewer sign-off can never silently alter the sourced claim
// it's signing off on.
// 'update' is the content-edit path (citation, expected date, reasoning) and
// explicitly does NOT flip `approved` -- editing a sourced claim must return
// it to unapproved for the next reviewer to re-check, never let an edit ride
// on a stale prior approval.
export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const caseId = body?.caseId;
  const action = body?.action;

  if (!caseId || !['approve', 'reject', 'update'].includes(action)) {
    return NextResponse.json(
      { error: 'Body must include { caseId: string, action: "approve" | "reject" | "update" }' },
      { status: 400 },
    );
  }

  const supabase = adminSupabase();
  const adminUsername = await getAdminUsername(request) ?? 'unknown admin';
  const nowIso = new Date().toISOString();

  // 1. Fetch target fixture state before modification for diff & audit trail
  const { data: existing, error: fetchErr } = await supabase
    .from('golden_fixtures')
    .select('*')
    .eq('case_id', caseId)
    .maybeSingle();

  if (fetchErr || !existing) {
    return NextResponse.json(
      { error: fetchErr?.message || `Fixture with case_id '${caseId}' not found` },
      { status: 404 },
    );
  }

  if (action === 'approve' || action === 'reject') {
    const willApprove = action === 'approve';
    const wasApproved = existing.approved === true;
    const transition = willApprove
      ? (wasApproved ? 're_confirmed' : 'newly_approved')
      : 'rejected';

    const { error: updateError } = await supabase
      .from('golden_fixtures')
      .update({
        approved: willApprove,
        reviewed_by: adminUsername,
        reviewed_at: nowIso,
        review_notes: body?.notes ?? null,
      })
      .eq('case_id', caseId);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    // Record immutable entry in audit log table
    try {
      await supabase.from('golden_fixture_audit_logs').insert({
        case_id: caseId,
        festival_id: existing.festival_id,
        year: existing.year,
        actor: adminUsername,
        action: transition,
        previous_approved: wasApproved,
        new_approved: willApprove,
        review_notes: body?.notes ?? null,
        diff: {
          previous_reviewed_by: existing.reviewed_by ?? null,
          previous_reviewed_at: existing.reviewed_at ?? null,
          new_reviewed_by: adminUsername,
          transition,
        },
      });
    } catch {
      // Non-fatal if logging fails
    }

    return NextResponse.json({
      ok: true,
      caseId,
      action,
      diff: {
        previousApproved: wasApproved,
        newApproved: willApprove,
        transition,
        reviewer: adminUsername,
        timestamp: nowIso,
        reviewNotes: body?.notes ?? null,
      },
    });
  }

  // action === 'update': content edit. Only these fields may change here --
  // caseId/festivalId/year/location/profile are identity, not editable content.
  const patch = body?.patch ?? {};
  const allowedKeys = ['expected', 'tolerance', 'source', 'reasoning'] as const;
  const update: Record<string, unknown> = {};
  for (const k of allowedKeys) {
    if (k in patch) update[k] = patch[k];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'patch must include at least one of expected/tolerance/source/reasoning' }, { status: 400 });
  }

  // An edit invalidates any prior approval -- the reviewer who approved the
  // OLD citation/date did not sign off on this one.
  const wasApproved = existing.approved === true;
  update.approved = false;
  update.reviewed_by = null;
  update.reviewed_at = null;
  update.review_notes = `Content edited by ${adminUsername}; approval reset, pending re-review.`;

  const { error: updateError } = await supabase.from('golden_fixtures').update(update).eq('case_id', caseId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Record audit log entry for content update
  try {
    await supabase.from('golden_fixture_audit_logs').insert({
      case_id: caseId,
      festival_id: existing.festival_id,
      year: existing.year,
      actor: adminUsername,
      action: 'content_updated',
      previous_approved: wasApproved,
      new_approved: false,
      review_notes: `Content edited by ${adminUsername}; approval reset, pending re-review.`,
      diff: {
        changed_fields: Object.keys(update).filter(k => !['approved', 'reviewed_by', 'reviewed_at', 'review_notes'].includes(k)),
        previous_expected: existing.expected ?? null,
        new_expected: update.expected ?? existing.expected ?? null,
        previous_source: existing.source ?? null,
        new_source: update.source ?? existing.source ?? null,
      },
    });
  } catch {
    // Non-fatal if logging fails
  }

  return NextResponse.json({
    ok: true,
    caseId,
    action: 'update',
    diff: {
      previousApproved: wasApproved,
      newApproved: false,
      transition: 'content_updated',
      reviewer: adminUsername,
      timestamp: nowIso,
    },
  });
}
