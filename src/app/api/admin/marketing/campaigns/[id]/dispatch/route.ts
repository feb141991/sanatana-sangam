import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { dispatchMarketingBatch } from "@/lib/marketing/dispatcher";
import { seedMarketingDispatches } from "@/lib/marketing/audience";
import type { MarketingCampaign, MarketingCampaignVariant } from "@/lib/marketing/types";

const LIVE_SEND_PHRASE = "LIVE SEND";

async function maybeCompleteCampaign(supabase: any, campaignId: string): Promise<string | null> {
  const { count, error } = await supabase
    .from("marketing_dispatches")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .in("status", ["pending", "claimed"]);

  if (error || (count ?? 0) > 0) {
    return null;
  }

  const { data } = await supabase
    .from("marketing_campaigns")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", campaignId)
    .eq("status", "dispatching")
    .select("status")
    .single();

  return data?.status ?? null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const dryRun = body.dry_run !== false; // Default: true (dry-run safe)
  const channel = body.channel as "email" | "whatsapp";

  if (!channel || (channel !== "email" && channel !== "whatsapp")) {
    return NextResponse.json({ error: "Valid channel (email or whatsapp) is required" }, { status: 400 });
  }

  const { data: campaignRow, error: campaignFetchError } = await admin.supabase
    .from("marketing_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (campaignFetchError || !campaignRow) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  const campaignSnapshot = campaignRow as MarketingCampaign;

  // A live send is the one genuinely irreversible action this route can take.
  // Server-side validation, not just a client-side checkbox: the admin must type the
  // literal phrase plus the campaign's own current title, checked against what's
  // actually in the database -- never trust a client-computed "confirmed" flag alone.
  if (!dryRun) {
    const confirmationPhrase = String(body.confirmation_phrase ?? "");
    const confirmedTitle = String(body.confirmed_title ?? "");
    if (confirmationPhrase !== LIVE_SEND_PHRASE || confirmedTitle !== campaignSnapshot.title) {
      return NextResponse.json(
        {
          error: `Live send requires confirmation_phrase="${LIVE_SEND_PHRASE}" and confirmed_title matching the campaign's exact current title`
        },
        { status: 400 }
      );
    }
  }

  // Race-safe transition: only the request that actually flips approved -> dispatching
  // is responsible for seeding the audience. A concurrent second request either loses
  // this update (0 rows, falls through to the re-fetch below) or -- if it arrives once
  // the campaign is already 'dispatching' -- is a legitimate "continue draining"
  // call, not a duplicate seed.
  const { data: claimedForStart } = await admin.supabase
    .from("marketing_campaigns")
    .update({ status: "dispatching", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "approved")
    .select("*")
    .single();

  let campaign: MarketingCampaign | null = claimedForStart ?? null;
  const isFirstBatch = Boolean(claimedForStart);

  if (!campaign) {
    if (campaignSnapshot.status !== "dispatching") {
      return NextResponse.json(
        {
          error: `Cannot dispatch campaign in "${campaignSnapshot.status}" status. Human approval is required first.`
        },
        { status: 409 }
      );
    }
    campaign = campaignSnapshot;
  }

  const { data: variant, error: varErr } = await admin.supabase
    .from("marketing_campaign_variants")
    .select("*")
    .eq("campaign_id", id)
    .eq("channel", channel)
    .single();

  if (varErr || !variant) {
    return NextResponse.json({ error: `No ${channel} variant found for campaign` }, { status: 404 });
  }

  if (isFirstBatch && !dryRun) {
    try {
      await seedMarketingDispatches(admin.supabase, campaign, (variant as MarketingCampaignVariant).id, channel);
    } catch (err: any) {
      return NextResponse.json({ error: `Failed to seed dispatch audience: ${err.message}` }, { status: 500 });
    }
  }

  let result;
  try {
    result = await dispatchMarketingBatch(admin.supabase, {
      campaign,
      variant: variant as MarketingCampaignVariant,
      dryRun
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }

  let campaignStatus = campaign.status;
  let remainingPending: number | null = null;

  if (!dryRun) {
    const { count } = await admin.supabase
      .from("marketing_dispatches")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", id)
      .in("status", ["pending", "claimed"]);
    remainingPending = count ?? null;

    const completedStatus = await maybeCompleteCampaign(admin.supabase, id);
    if (completedStatus) {
      campaignStatus = completedStatus as MarketingCampaign["status"];
    }
  }

  return NextResponse.json({ result, campaignStatus, remainingPending });
}
