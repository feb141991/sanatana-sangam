import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { assertNotBanned } from "@/lib/api-guards";
import { localSpiritualDate } from "@/lib/sacred-time";

// ── Karma awarded for observing a vrat ───────────────────────────────────────
const VRAT_KARMA = 25;

// ── GET /api/vrat/observe?vrat_id=X ──────────────────────────────────────────
// Returns whether the authenticated user has observed this vrat today and
// the all-time observation count for this vrat.
// Auth: supports cookie session (PWA) and Bearer token (Native).
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const vrat_id = req.nextUrl.searchParams.get("vrat_id");
  if (!vrat_id) {
    return NextResponse.json({ error: "Missing vrat_id" }, { status: 400 });
  }

  // Fetch user timezone for spiritual date calculation (starts at 4 AM)
  const { data: tzRow } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();
  const today = localSpiritualDate(tzRow?.timezone, 4);

  // 1. Query canonical vrat_observations ledger
  const { data: obsRows } = await supabase
    .from("vrat_observations")
    .select("occurrence_date")
    .eq("user_id", user.id)
    .eq("vrat_id", vrat_id)
    .order("occurrence_date", { ascending: false });

  // 2. Query legacy recommendations table for historical fallback
  const recType = `vrat_obs:${vrat_id}`;
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
// Mark a vrat as observed for an occurrence date. Idempotent — duplicate calls
// return the same success response without double-awarding karma.
// Auth: supports cookie session (PWA) and Bearer token (Native).
// Body: {
//   vrat_id: string,
//   vrat_name?: string,
//   occurrence_date?: string, // YYYY-MM-DD
//   occurrence_id?: string,
//   calendar_profile?: string,
//   tradition?: string
// }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(req);
  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const banned = await assertNotBanned(supabase, user.id);
  if (banned) return banned;

  const body = await req.json().catch(() => ({}));
  const {
    vrat_id,
    vrat_name,
    occurrence_date,
    occurrence_id,
    calendar_profile,
    tradition,
  } = body;

  if (!vrat_id || typeof vrat_id !== "string" || vrat_id.trim().length === 0) {
    return NextResponse.json({ error: "Missing or invalid vrat_id" }, { status: 400 });
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, calendar_profile, tradition")
    .eq("id", user.id)
    .maybeSingle();

  const today = localSpiritualDate(profile?.timezone, 4);

  // Target date must be valid YYYY-MM-DD
  let targetDate = today;
  if (occurrence_date && typeof occurrence_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(occurrence_date)) {
    // Prevent recording observations for dates beyond today
    if (occurrence_date > today) {
      return NextResponse.json({ error: "Cannot record observation for future date" }, { status: 400 });
    }
    targetDate = occurrence_date;
  }

  // Try executing the atomic RPC function
  const { data: rpcResult, error: rpcErr } = await supabase.rpc("record_vrat_observation", {
    p_vrat_id: vrat_id.trim(),
    p_vrat_name: vrat_name || vrat_id.trim(),
    p_occurrence_date: targetDate,
    p_occurrence_id: occurrence_id || null,
    p_calendar_profile: calendar_profile || profile?.calendar_profile || null,
    p_tradition: tradition || profile?.tradition || null,
    p_timezone: profile?.timezone || "Asia/Kolkata",
    p_karma: VRAT_KARMA,
  });

  if (!rpcErr && rpcResult) {
    return NextResponse.json({
      success: true,
      already_observed: Boolean(rpcResult.already_observed),
      karma_earned: rpcResult.karma_earned ?? 0,
      today: targetDate,
    });
  }

  // Fallback if RPC is not yet deployed: atomic insert on vrat_observations table
  const { data: inserted, error: insertErr } = await supabase
    .from("vrat_observations")
    .insert({
      user_id: user.id,
      vrat_id: vrat_id.trim(),
      vrat_name: vrat_name || vrat_id.trim(),
      occurrence_date: targetDate,
      occurrence_id: occurrence_id || null,
      calendar_profile: calendar_profile || profile?.calendar_profile || null,
      tradition: tradition || profile?.tradition || null,
      timezone: profile?.timezone || "Asia/Kolkata",
      karma_awarded: VRAT_KARMA,
    })
    .select("id")
    .maybeSingle();

  if (insertErr) {
    // Unique violation means already observed
    if (insertErr.code === "23505") {
      return NextResponse.json({
        success: true,
        already_observed: true,
        karma_earned: 0,
        today: targetDate,
      });
    }

    // Fallback to legacy recommendations if table does not exist
    const recType = `vrat_obs:${vrat_id.trim()}`;
    const { data: existingRec } = await supabase
      .from("recommendations")
      .select("date")
      .eq("user_id", user.id)
      .eq("type", recType)
      .eq("date", targetDate)
      .maybeSingle();

    if (existingRec) {
      return NextResponse.json({
        success: true,
        already_observed: true,
        karma_earned: 0,
        today: targetDate,
      });
    }

    const { error: upsertErr } = await supabase
      .from("recommendations")
      .upsert(
        {
          user_id: user.id,
          date: targetDate,
          type: recType,
          content: {
            vrat_id: vrat_id.trim(),
            vrat_name: vrat_name || vrat_id.trim(),
            karma_earned: VRAT_KARMA,
            observed_at: new Date().toISOString(),
          },
          generated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,date,type" }
      );

    if (upsertErr) {
      return NextResponse.json({ error: "Failed to record observation" }, { status: 500 });
    }
  }

  // Award karma
  const { error: karmaErr } = await supabase.rpc("increment_karma", {
    p_user_id: user.id,
    p_amount: VRAT_KARMA,
  });

  return NextResponse.json({
    success: true,
    already_observed: false,
    karma_earned: karmaErr ? 0 : VRAT_KARMA,
    today: targetDate,
  });
}
