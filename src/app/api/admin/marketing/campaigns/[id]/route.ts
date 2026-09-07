import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { cancelCampaign, saveVariant, submitForReview } from "@/lib/marketing/campaign-service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;

  const { data: campaign, error } = await admin.supabase
    .from("marketing_campaigns")
    .select("*, marketing_campaign_variants(*)")
    .eq("id", id)
    .single();

  if (error || !campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Fetch dispatch count summary
  const { data: dispatches } = await admin.supabase
    .from("marketing_dispatches")
    .select("status, channel")
    .eq("campaign_id", id);

  const dispatchSummary = (dispatches ?? []).reduce((acc: any, d: any) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({ campaign, dispatchSummary });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    if (body.action === "submit_review") {
      const campaign = await submitForReview(admin.supabase, id);
      return NextResponse.json({ campaign });
    }

    if (body.variant) {
      const variant = await saveVariant(admin.supabase, {
        campaign_id: id,
        channel: body.variant.channel,
        locale: body.variant.locale ?? "en",
        subject: body.variant.subject,
        body: body.variant.body,
        cta_text: body.variant.cta_text,
        cta_url: body.variant.cta_url,
        source_snapshot: body.variant.source_snapshot,
      });
      return NextResponse.json({ variant });
    }

    return NextResponse.json({ error: "No recognized action or variant provided" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;

  try {
    const campaign = await cancelCampaign(admin.supabase, id);
    return NextResponse.json({ campaign });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
