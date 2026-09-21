import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { reserveSocialPost } from "@/lib/marketing/social/reservation";

const DEFAULT_TIMEZONE = "Asia/Kolkata";

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const url = new URL(request.url);
  const stage = url.searchParams.get("stage");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50) || 50, 200);

  let query = admin.supabase
    .from("social_posts")
    .select("id, post_key, theme_type, internal_label, pipeline_stage, objective, frozen_scheduled_publish_at, approved_by, created_at, updated_at")
    .order("frozen_scheduled_publish_at", { ascending: false })
    .limit(limit);

  if (stage) query = query.eq("pipeline_stage", stage);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [] });
}

/**
 * Manual reservation, for an admin adding an extra post outside the daily
 * tick (e.g. a special campaign day). Goes through the exact same
 * reserveSocialPost path the tick uses -- same idempotency, same pause
 * checks, same policy freeze -- just triggered synchronously instead of on
 * a schedule.
 */
export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const body = await request.json().catch(() => ({}));
  const contentType = body.content_type;
  const targetDate = body.target_date;
  if (contentType !== "festival" && contentType !== "general") {
    return NextResponse.json({ error: "content_type must be 'festival' or 'general'" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(targetDate ?? ""))) {
    return NextResponse.json({ error: "target_date must be 'YYYY-MM-DD'" }, { status: 400 });
  }

  try {
    const outcome = await reserveSocialPost(admin.supabase, {
      contentType,
      targetDate,
      targetTimezone: body.target_timezone ?? DEFAULT_TIMEZONE,
      targetRegion: body.target_region ?? null,
      targetTradition: body.target_tradition ?? null,
      objective: body.objective ?? "awareness",
      createdBy: admin.username
    });
    return NextResponse.json(outcome);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
