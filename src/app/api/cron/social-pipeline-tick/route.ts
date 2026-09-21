import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { reserveSocialPost } from "@/lib/marketing/social/reservation";
import { advancePostCaptions, publishApprovedPost } from "@/lib/marketing/social/pipeline";
import { localDateInZone } from "@/lib/marketing/social/schedule-time";

// ─── Social Publishing Pipeline Tick ────────────────────────────────────────
// Scheduled via Supabase pg_cron (pg_net -> net.http_get), NOT a Vercel cron
// -- same reasoning as notification-dispatch: the publish stage needs
// sub-daily cadence to hit each post's scheduled local publish time with
// reasonable precision, and this project's crons on Vercel have so far
// stayed daily-or-slower (see vercel.json), consistent with the Hobby-tier
// cap documented on notification-dispatch's own migration. See
// supabase/migrations/20260921030000_schedule_social_pipeline_tick_pg_cron.sql.
//
// Cadence-agnostic by design (per the approved plan): every run (a) tries to
// reserve tomorrow's festival/general posts (idempotent -- post_key's unique
// constraint makes a repeat reservation attempt a harmless no-op), (b) drafts
// captions for any post sitting in image_ready, (c) attempts to publish any
// approved post whose scheduled time has arrived. None of these steps
// assume they are the only thing that can touch a post -- every write goes
// through claim_social_post_stage or an idempotent insert.

const TARGET_TIMEZONE = "Asia/Kolkata"; // Shoonaya's primary audience timezone; per-post override
// via target_timezone remains available for a future region-specific config row.
const RESERVE_DAYS_AHEAD = 1; // draft-ahead scheduling (plan section 10): reserve tomorrow's post today

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const tickSecret = process.env.SOCIAL_PIPELINE_TICK_SECRET;
  if (!cronSecret && !tickSecret) {
    return NextResponse.json({ error: "No tick secret is configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  const authorized =
    (!!cronSecret && authHeader === "Bearer " + cronSecret) ||
    (!!tickSecret && authHeader === "Bearer " + tickSecret);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const results: Record<string, unknown> = {};

  // (a) Reservation for tomorrow, both content types independently.
  const targetDate = localDateInZone(new Date(Date.now() + RESERVE_DAYS_AHEAD * 86400000), TARGET_TIMEZONE);
  const reservations = [];
  for (const contentType of ["festival", "general"] as const) {
    try {
      const outcome = await reserveSocialPost(supabase, {
        contentType,
        targetDate,
        targetTimezone: TARGET_TIMEZONE,
        objective: contentType === "festival" ? "awareness" : "app_discovery",
        createdBy: "system:social-pipeline-tick"
      });
      reservations.push({ contentType, ...outcome });
    } catch (err: any) {
      reservations.push({ contentType, reserved: false, reason: `error: ${err.message}` });
    }
  }
  results.reservations = reservations;

  // (b) Caption drafting for posts sitting in image_ready.
  const { data: imageReadyPosts } = await supabase.from("social_posts").select("id").eq("pipeline_stage", "image_ready").limit(20);
  const captionResults = [];
  for (const post of imageReadyPosts ?? []) {
    try {
      captionResults.push({ postId: post.id, ...(await advancePostCaptions(supabase, post.id)) });
    } catch (err: any) {
      captionResults.push({ postId: post.id, advanced: false, reason: `error: ${err.message}` });
    }
  }
  results.captions = captionResults;

  // (c) Publish approved posts whose scheduled time has arrived.
  const { data: approvedPosts } = await supabase
    .from("social_posts")
    .select("id")
    .eq("pipeline_stage", "approved")
    .lte("frozen_scheduled_publish_at", new Date().toISOString())
    .limit(10);
  const publishResults = [];
  for (const post of approvedPosts ?? []) {
    try {
      publishResults.push({ postId: post.id, ...(await publishApprovedPost(supabase, post.id, { manualPublishNow: false, triggeredBy: "system:social-pipeline-tick" })) });
    } catch (err: any) {
      publishResults.push({ postId: post.id, attempted: false, reason: `error: ${err.message}` });
    }
  }
  results.publishes = publishResults;

  return NextResponse.json({ ok: true, targetDate, ...results });
}
