import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { assertNotBanned } from "@/lib/api-guards";
import { localSpiritualDate } from "@/lib/sacred-time";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── GET /api/vrat/observe?occurrence_id=X or ?vrat_id=X ──────────────────────
// Returns whether the authenticated user has observed this occurrence/vrat.
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

  // Fetch timezone for spiritual date calculation (starts at 4 AM)
  const { data: tzRow } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();
  const today = localSpiritualDate(tzRow?.timezone, 4);

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
  const { data: obsRows } = await supabase
    .from("vrat_observations")
    .select("occurrence_date")
    .eq("user_id", user.id)
    .eq("vrat_id", cleanVratId)
    .order("occurrence_date", { ascending: false });

  // Historical fallback from legacy recommendations table
  const recType = `vrat_obs:${cleanVratId}`;
  const { data: legacyRows } = await supabase
    .from("recommendations")
    .select("date")
    .eq("user_id", user.id)
    .eq("type", recType)
    .order("date", { ascending: false });

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
// Mark a canonical vrat occurrence as observed. Idempotent.
// Body: { occurrence_id: string }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const banned = await assertNotBanned(supabase, user.id);
  if (banned) return banned;

  const body = await req.json().catch(() => ({}));
  const { occurrence_id } = body;

  if (!occurrence_id || typeof occurrence_id !== "string" || !UUID_REGEX.test(occurrence_id)) {
    return NextResponse.json({
      error: "Missing or invalid occurrence_id (canonical UUID required)",
    }, { status: 400 });
  }

  // Execute atomic, occurrence-qualified observation RPC
  const { data: rpcResult, error: rpcErr } = await supabase.rpc("record_vrat_observation", {
    p_occurrence_id: occurrence_id,
  });

  if (rpcErr) {
    console.error("[vrat/observe] RPC failure:", rpcErr.message);
    const msg = rpcErr.message || "Failed to record observation";
    if (msg.includes("not found") || msg.includes("not an active") || msg.includes("unverified") || msg.includes("does not match")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    already_observed: Boolean(rpcResult?.already_observed),
    karma_earned: rpcResult?.karma_earned ?? 0,
    occurrence_date: rpcResult?.occurrence_date ?? null,
  });
}
