import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { publishApprovedPost } from "@/lib/marketing/social/pipeline";

const LIVE_SEND_PHRASE = "LIVE SEND";

/**
 * "Publish now" is the one genuinely irreversible action this route can
 * take -- same typed-confirmation pattern as
 * src/app/api/admin/marketing/campaigns/[id]/dispatch/route.ts. The admin
 * must type the literal phrase plus the post's own current internal_label,
 * checked server-side against what's actually in the database.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const { data: post, error: postError } = await admin.supabase.from("social_posts").select("internal_label, pipeline_stage").eq("id", id).single();
  if (postError || !post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const confirmationPhrase = String(body.confirmation_phrase ?? "");
  const confirmedLabel = String(body.confirmed_label ?? "");
  if (confirmationPhrase !== LIVE_SEND_PHRASE || confirmedLabel !== post.internal_label) {
    return NextResponse.json(
      { error: `Publish now requires confirmation_phrase="${LIVE_SEND_PHRASE}" and confirmed_label matching the post's exact current internal_label` },
      { status: 400 }
    );
  }
  if (post.pipeline_stage !== "approved") {
    return NextResponse.json({ error: `Cannot publish a post in '${post.pipeline_stage}' stage -- must be 'approved'` }, { status: 409 });
  }

  try {
    const outcome = await publishApprovedPost(admin.supabase, id, { manualPublishNow: true, triggeredBy: admin.username });
    return NextResponse.json(outcome);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
