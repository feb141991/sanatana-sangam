import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { previewMarketingAudience } from "@/lib/marketing/audience";
import type { MarketingCampaign } from "@/lib/marketing/types";

/**
 * Recipient-count preview for the admin dispatch confirmation UI. Uses the exact same
 * candidate query and evaluateMarketingConsent call dispatchMarketingBatch itself uses
 * (via previewMarketingAudience/iterateAudienceCandidates) -- the number an admin sees
 * before confirming a live send is not a separately-estimated figure that could drift
 * from what actually gets claimed and sent.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel");

  if (channel !== "email" && channel !== "whatsapp") {
    return NextResponse.json({ error: "Valid channel (email or whatsapp) is required" }, { status: 400 });
  }

  const { data: campaign, error } = await admin.supabase
    .from("marketing_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  try {
    const preview = await previewMarketingAudience(admin.supabase, campaign as MarketingCampaign, channel);
    return NextResponse.json({ preview });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
