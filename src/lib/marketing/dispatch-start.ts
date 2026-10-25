/**
 * Starting a campaign dispatch, separated from sending it.
 *
 * The dispatch route used to flip an approved campaign to "dispatching" before it had checked anything,
 * and it did so for dry runs too (dry run is the default). Two things followed from that:
 *   - any failure after the flip (missing variant, edited since approval, WhatsApp on the mock provider,
 *     no eligible recipients) left the campaign stuck in "dispatching" with nothing sent; and
 *   - the audience was only seeded by the call that did the flip, so a dry run used up the one seeding
 *     chance and the later live send found no recipients and finished as "completed" having sent nothing.
 *
 * Here every check that can fail runs BEFORE the status changes, a dry run never writes anything, and the
 * audience is seeded whenever this variant has none (seeding is idempotent), so a campaign that a dry run
 * already left in "dispatching" is repaired by its next live send. dispatchMarketingBatch keeps its own
 * copies of the same guards (defence in depth); dispatch-start.test.ts pins that the two agree.
 */
import { previewMarketingAudience, seedMarketingDispatches, type AudiencePreview } from "./audience";
import { variantMatchesApprovedManifest } from "./dispatcher";
import { createWhatsAppProvider } from "@/lib/whatsapp/provider";
import type { MarketingCampaign, MarketingCampaignVariant, MarketingChannel } from "./types";

export type StartDispatchResult =
  | {
      ok: true;
      campaign: MarketingCampaign;
      /** Set only for a dry run on a campaign whose audience has not been seeded yet. */
      preview: AudiencePreview | null;
    }
  | { ok: false; status: number; code: StartDispatchFailureCode; error: string };

export type StartDispatchFailureCode =
  | "not_approved"
  | "variant_changed_since_approval"
  | "whatsapp_provider_not_configured"
  | "no_eligible_recipients"
  | "audience_seed_failed"
  | "count_failed"
  | "status_changed";

function fail(status: number, code: StartDispatchFailureCode, error: string): StartDispatchResult {
  return { ok: false, status, code, error };
}

/** Same conditions as the guards at the top of dispatchMarketingBatch, reported before anything is written. */
export function checkDispatchPreconditions(
  variant: MarketingCampaignVariant,
  dryRun: boolean
): { code: StartDispatchFailureCode; error: string } | null {
  if (!variantMatchesApprovedManifest(variant)) {
    return {
      code: "variant_changed_since_approval",
      error: "Variant content no longer matches its approved manifest (edited since approval) -- re-approve before dispatching"
    };
  }
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  if (!dryRun && variant.channel === "whatsapp" && isProduction && createWhatsAppProvider().isMock) {
    return {
      code: "whatsapp_provider_not_configured",
      error: "Cannot dispatch WhatsApp marketing campaign in production using mock provider (fail closed)."
    };
  }
  return null;
}

async function countDispatchRows(
  supabase: any,
  campaignId: string,
  scope?: { variantId: string; channel: MarketingChannel }
): Promise<number | null> {
  let query = supabase
    .from("marketing_dispatches")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId);
  if (scope) {
    query = query.eq("variant_id", scope.variantId).eq("channel", scope.channel);
  }
  const { count, error } = await query;
  return error ? null : (count ?? 0);
}

/** A campaign that was marked "dispatching" but never had a single recipient row has sent nothing: put it back. */
async function revertIfNothingWasEverQueued(supabase: any, campaign: MarketingCampaign): Promise<void> {
  if (campaign.status !== "dispatching") return;
  const total = await countDispatchRows(supabase, campaign.id);
  if (total !== 0) return;
  await supabase
    .from("marketing_campaigns")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", campaign.id)
    .eq("status", "dispatching");
}

export async function startCampaignDispatch(
  supabase: any,
  input: {
    campaign: MarketingCampaign;
    variant: MarketingCampaignVariant;
    channel: MarketingChannel;
    dryRun: boolean;
  }
): Promise<StartDispatchResult> {
  const { campaign, variant, channel, dryRun } = input;

  if (campaign.status !== "approved" && campaign.status !== "dispatching") {
    return fail(
      409,
      "not_approved",
      `Cannot dispatch campaign in "${campaign.status}" status. Human approval is required first.`
    );
  }

  const problem = checkDispatchPreconditions(variant, dryRun);
  if (problem) return fail(409, problem.code, problem.error);

  const queued = await countDispatchRows(supabase, campaign.id, { variantId: variant.id, channel });
  if (queued === null) return fail(500, "count_failed", "Could not read the campaign's delivery state");

  if (dryRun) {
    // Read-only: no status change, no seeding. When nothing is queued yet, show who a live send would reach.
    const preview = queued === 0 ? await previewMarketingAudience(supabase, campaign, channel) : null;
    return { ok: true, campaign, preview };
  }

  if (queued === 0) {
    try {
      await seedMarketingDispatches(supabase, campaign, variant.id, channel);
    } catch {
      return fail(500, "audience_seed_failed", "Could not prepare the campaign audience");
    }
    const seeded = await countDispatchRows(supabase, campaign.id, { variantId: variant.id, channel });
    if (seeded === null) return fail(500, "count_failed", "Could not read the campaign's delivery state");
    if (seeded === 0) {
      await revertIfNothingWasEverQueued(supabase, campaign);
      return fail(
        409,
        "no_eligible_recipients",
        `No recipients are eligible for ${channel} on this campaign (nobody has agreed to receive it). Nothing was sent.`
      );
    }
  }

  if (campaign.status === "approved") {
    const { data: flipped } = await supabase
      .from("marketing_campaigns")
      .update({ status: "dispatching", updated_at: new Date().toISOString() })
      .eq("id", campaign.id)
      .eq("status", "approved")
      .select("*")
      .single();
    if (flipped) return { ok: true, campaign: flipped as MarketingCampaign, preview: null };

    // Lost a race (another request flipped it first) or the status moved: only carry on if it is now dispatching.
    const { data: current } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .eq("id", campaign.id)
      .single();
    if (current && (current as MarketingCampaign).status === "dispatching") {
      return { ok: true, campaign: current as MarketingCampaign, preview: null };
    }
    return fail(
      409,
      "status_changed",
      `Cannot dispatch campaign in "${(current as MarketingCampaign | null)?.status ?? "unknown"}" status. Human approval is required first.`
    );
  }

  return { ok: true, campaign, preview: null };
}

/**
 * Marks a campaign completed once nothing is left to send. Never completes a campaign that has no recipient
 * rows at all: that campaign sent nothing, and calling it completed would be a false report.
 */
export async function maybeCompleteCampaign(supabase: any, campaignId: string): Promise<string | null> {
  const { count: open, error: openError } = await supabase
    .from("marketing_dispatches")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .in("status", ["pending", "claimed", "retryable", "outcome_unknown"]);
  if (openError || (open ?? 0) > 0) return null;

  const total = await countDispatchRows(supabase, campaignId);
  if (!total) return null;

  const { data } = await supabase
    .from("marketing_campaigns")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", campaignId)
    .eq("status", "dispatching")
    .select("status")
    .single();
  return data?.status ?? null;
}
