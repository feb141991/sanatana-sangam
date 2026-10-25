import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { dispatchMarketingBatch } from "@/lib/marketing/dispatcher";
import { maybeCompleteCampaign, startCampaignDispatch } from "@/lib/marketing/dispatch-start";
import type { MarketingCampaign, MarketingCampaignVariant } from "@/lib/marketing/types";

const LIVE_SEND_PHRASE = "LIVE SEND";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const dryRun = body.dry_run !== false; // Default: true (dry-run safe)
  const channel = body.channel as "email" | "whatsapp";
  const variantId = typeof body.variant_id === "string" ? body.variant_id.trim() : "";
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  if (!channel || (channel !== "email" && channel !== "whatsapp")) {
    return NextResponse.json({ error: "Valid channel (email or whatsapp) is required" }, { status: 400 });
  }
  if (!variantId) {
    return NextResponse.json({ error: "variant_id is required" }, { status: 400 });
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

  const { data: variant, error: varErr } = await admin.supabase
    .from("marketing_campaign_variants")
    .select("*")
    .eq("id", variantId)
    .eq("campaign_id", id)
    .eq("channel", channel)
    .single();

  if (varErr || !variant) {
    return NextResponse.json({ error: `No ${channel} variant found for campaign` }, { status: 404 });
  }

  // Every check that can fail runs here, before the campaign's status changes; a dry run changes nothing.
  const started = await startCampaignDispatch(admin.supabase, {
    campaign: campaignSnapshot,
    variant: variant as MarketingCampaignVariant,
    channel,
    dryRun
  });
  if (!started.ok) {
    return NextResponse.json({ error: started.error, code: started.code }, { status: started.status });
  }
  const campaign = started.campaign;

  // A dry run on a campaign nobody has been queued for yet: report who a live send would reach.
  if (dryRun && started.preview) {
    return NextResponse.json({
      result: {
        total: started.preview.total,
        sent: started.preview.eligible,
        suppressed: started.preview.total - started.preview.eligible,
        failed: 0,
        retryable: 0,
        outcomeUnknown: 0,
        dryRun: true,
        dispatches: []
      },
      campaignStatus: campaign.status,
      remainingPending: null
    });
  }

  let result;
  try {
    result = await dispatchMarketingBatch(admin.supabase, {
      campaign,
      variant: variant as MarketingCampaignVariant,
      dryRun
    });
  } catch (error: unknown) {
    console.error("[marketing.dispatch] batch failed", {
      requestId,
      code: "MARKETING_DISPATCH_FAILED",
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      {
        error: "Campaign dispatch could not be completed",
        code: "MARKETING_DISPATCH_FAILED",
        requestId,
      },
      { status: 500, headers: { "X-Request-ID": requestId } }
    );
  }

  let campaignStatus = campaign.status;
  let remainingPending: number | null = null;

  if (!dryRun) {
    const { count } = await admin.supabase
      .from("marketing_dispatches")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", id)
      .in("status", ["pending", "claimed", "retryable", "outcome_unknown"]);
    remainingPending = count ?? null;

    const completedStatus = await maybeCompleteCampaign(admin.supabase, id);
    if (completedStatus) {
      campaignStatus = completedStatus as MarketingCampaign["status"];
    }
  }

  return NextResponse.json({ result, campaignStatus, remainingPending });
}
