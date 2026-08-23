import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { assertNotBanned } from "@/lib/api-guards";
import { localSpiritualDate } from "@/lib/sacred-time";
import { createServiceRoleSupabaseClient } from "@/lib/admin";
import { UUID_REGEX } from "@/lib/vrat-observation";
import { resolveObservableVratOccurrence } from "@/lib/calendar/vrat-observable-resolver";

// ── GET /api/vrat/observe?occurrence_id=X or ?vrat_id=X ──────────────────────
// Returns observation state strictly for the authenticated user.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const occurrence_id = req.nextUrl.searchParams.get("occurrence_id");
  const vrat_id = req.nextUrl.searchParams.get("vrat_id");

  if (!occurrence_id && !vrat_id) {
    return NextResponse.json({ error: "Missing occurrence_id or vrat_id parameter" }, { status: 400 });
  }

  // Fetch timezone for spiritual date calculation (starts at 4 AM) - fail closed on error
  const { data: tzRow, error: tzErr } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();

  if (tzErr || !tzRow?.timezone) {
    return NextResponse.json({ error: "Failed to resolve user timezone profile" }, { status: 500 });
  }

  const today = localSpiritualDate(tzRow.timezone, 4);

  // 1. If querying by canonical occurrence_id
  if (occurrence_id) {
    if (!UUID_REGEX.test(occurrence_id)) {
      return NextResponse.json({ error: "Invalid occurrence_id format" }, { status: 400 });
    }

    const { data: obsRow, error: obsErr } = await supabase
      .from("vrat_observations")
      .select("occurrence_date, karma_awarded, observed_at")
      .eq("user_id", user.id)
      .eq("occurrence_id", occurrence_id)
      .maybeSingle();

    if (obsErr) {
      console.error("[vrat/observe] GET error:", obsErr.message);
      return NextResponse.json({ error: "Failed to read observation state" }, { status: 500 });
    }

    const isObserved = Boolean(obsRow);
    return NextResponse.json({
      observed_today: isObserved,
      total_count: isObserved ? 1 : 0,
      today,
      occurrence_date: obsRow?.occurrence_date ?? null,
    });
  }

  // 2. If querying by general vrat_id (library overview)
  const cleanVratId = vrat_id!.trim();
  const { data: obsRows, error: obsErr } = await supabase
    .from("vrat_observations")
    .select("occurrence_date")
    .eq("user_id", user.id)
    .eq("vrat_id", cleanVratId)
    .order("occurrence_date", { ascending: false });

  if (obsErr) {
    console.error("[vrat/observe] GET ledger error:", obsErr.message);
    return NextResponse.json({ error: "Failed to query observation history" }, { status: 500 });
  }

  // Read-only historical count from legacy recommendations table
  const recType = `vrat_obs:${cleanVratId}`;
  const { data: legacyRows, error: legErr } = await supabase
    .from("recommendations")
    .select("date")
    .eq("user_id", user.id)
    .eq("type", recType)
    .order("date", { ascending: false });

  if (legErr) {
    console.error("[vrat/observe] GET legacy error:", legErr.message);
    return NextResponse.json({ error: "Failed to query historical recommendations" }, { status: 500 });
  }

  const datesSeen = new Set<string>();
  (obsRows ?? []).forEach((r: { occurrence_date: string }) => {
    if (r.occurrence_date) datesSeen.add(r.occurrence_date);
  });
  (legacyRows ?? []).forEach((r: { date: string }) => {
    if (r.date) datesSeen.add(r.date);
  });

  const observedToday = datesSeen.has(today);
  const totalCount = datesSeen.size;

  return NextResponse.json({
    observed_today: observedToday,
    total_count: totalCount,
    today,
  });
}

// ── POST /api/vrat/observe ────────────────────────────────────────────────────
// Mark a canonical vrat occurrence as observed.
// Body: { occurrence_id: string }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const banned = await assertNotBanned(supabase, user.id);
  if (banned) return banned;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
  }

  // Reject unknown or hostile fields
  const allowedKeys = new Set(["occurrence_id"]);
  const extraKeys = Object.keys(body).filter((k) => !allowedKeys.has(k));
  if (extraKeys.length > 0) {
    return NextResponse.json({
      error: `Unknown request fields: ${extraKeys.join(", ")}`,
    }, { status: 400 });
  }

  const occurrence_id = body.occurrence_id;
  if (!occurrence_id || typeof occurrence_id !== "string" || !UUID_REGEX.test(occurrence_id)) {
    return NextResponse.json({
      error: "Missing or invalid occurrence_id (canonical UUID required)",
    }, { status: 400 });
  }

  // Resolve occurrence using canonical pipeline
  const resolution = await resolveObservableVratOccurrence(req, occurrence_id);
  if (!resolution.success) {
    return NextResponse.json({
      error: resolution.userMessage,
      code: resolution.errorCode,
    }, { status: resolution.statusCode });
  }

  // Execute internal service-role transaction RPC
  const adminClient = createServiceRoleSupabaseClient();
  const { data: rpcResult, error: rpcErr } = await adminClient.rpc("record_vrat_observation", {
    p_user_id: user.id,
    p_occurrence_id: occurrence_id,
    p_calendar_profile: resolution.user.calendarProfile,
    p_tradition: resolution.user.tradition,
    p_sampradaya: resolution.user.sampradaya,
    p_spiritual_tradition: resolution.occurrence.sampradayaIdentity,
    p_variant_key: resolution.occurrence.variantKey,
  });

  if (rpcErr) {
    console.error("[vrat/observe] Internal RPC failure:", rpcErr.message);
    return NextResponse.json({
      error: "Failed to record observation",
      code: "LEDGER_WRITE_ERROR",
    }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    already_observed: Boolean(rpcResult?.already_observed),
    karma_earned: rpcResult?.karma_earned ?? 0,
    occurrence_date: rpcResult?.occurrence_date ?? resolution.occurrence.date,
  });
}
