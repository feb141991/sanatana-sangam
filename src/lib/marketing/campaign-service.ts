import crypto from "node:crypto";
import type {
  MarketingCampaign,
  MarketingCampaignStatus,
  MarketingCampaignVariant,
  MarketingChannel,
  MarketingSourceSnapshot,
  MarketingSourceType
} from "./types";
import { getPublishableOccurrenceById } from "./sources/published-observance";

export interface ManifestInput {
  subject?: string | null;
  body: string;
  cta_text?: string | null;
  cta_url?: string | null;
  source_snapshot?: MarketingSourceSnapshot;
  source_citations?: unknown[];
  channel: MarketingChannel;
  locale: string;
}

/**
 * Deterministic SHA-256 hash over everything approval binds to: subject, body,
 * CTA text/URL, source snapshot, citations, channel, and locale. Used both as the
 * per-save content_hash and, captured at the moment of approval, as
 * approved_manifest_hash -- dispatch re-derives this same hash from the variant's
 * current row and rejects if it no longer matches what was approved.
 */
export function computeContentHash(input: ManifestInput): string {
  const canonical = JSON.stringify({
    subject: input.subject ?? null,
    body: input.body,
    cta_text: input.cta_text ?? null,
    cta_url: input.cta_url ?? null,
    source_snapshot: input.source_snapshot ?? {},
    source_citations: input.source_citations ?? [],
    channel: input.channel,
    locale: input.locale
  });
  return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
}

// Campaign statuses that no longer accept edits (variant changes, submit-for-review) --
// once a campaign is dispatching, its approved manifest is what's being sent; once
// completed or cancelled, editing it would be misleading (it reads as changing history).
const TERMINAL_OR_INFLIGHT_STATUSES: MarketingCampaignStatus[] = ["dispatching", "completed", "cancelled"];
// Statuses cancelCampaign may transition out of -- cancelling an already-terminal
// campaign is a no-op error, not a new transition.
const CANCELLABLE_STATUSES: MarketingCampaignStatus[] = ["draft", "in_review", "approved", "dispatching"];

export interface CreateCampaignParams {
  campaign_key: string;
  title: string;
  campaign_type?: "newsletter" | "festival_reminder" | "announcement";
  source_type?: MarketingSourceType;
  source_occurrence_id?: string | null;
  created_by: string;
}

export interface SaveVariantParams {
  campaign_id: string;
  channel: MarketingChannel;
  locale?: string;
  subject?: string | null;
  body: string;
  cta_text?: string | null;
  cta_url?: string | null;
  source_snapshot?: MarketingSourceSnapshot;
  source_citations?: unknown[];
  generation_provenance?: Record<string, unknown> | null;
  generation_metadata?: Record<string, unknown> | null;
}

/**
 * Creates a new marketing campaign in draft status. When sourced from a published
 * observance, the occurrence ID is re-validated server-side against the same
 * withheld/disputed/publication-status gate the admin GUI's dropdown uses to *offer*
 * occurrences -- a direct API call cannot bind a campaign to one that isn't actually
 * eligible just because it skipped the dropdown.
 */
export async function createCampaign(supabase: any, params: CreateCampaignParams): Promise<MarketingCampaign> {
  const sourceType = params.source_type ?? "manual";
  const sourceOccurrenceId = params.source_occurrence_id ?? null;
  let sourceVerifiedAt: string | null = null;

  if (sourceType === "published_observance") {
    if (!sourceOccurrenceId) {
      throw new Error("source_occurrence_id is required when source_type is 'published_observance'");
    }
    const occurrence = await getPublishableOccurrenceById(supabase, sourceOccurrenceId);
    if (!occurrence) {
      throw new Error(
        `Occurrence ${sourceOccurrenceId} is not currently publishable (withheld, disputed, unpublished, or unruled) -- cannot create a marketing campaign from it`
      );
    }
    sourceVerifiedAt = new Date().toISOString();
  }

  const insertPayload = {
    campaign_key: params.campaign_key.trim(),
    title: params.title.trim(),
    campaign_type: params.campaign_type ?? "newsletter",
    source_type: sourceType,
    source_occurrence_id: sourceOccurrenceId,
    source_verified_at: sourceVerifiedAt,
    status: "draft",
    created_by: params.created_by,
  };

  const { data, error } = await supabase
    .from("marketing_campaigns")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create campaign: ${error.message}`);
  }

  return data as MarketingCampaign;
}

/**
 * Upserts a channel variant for a campaign. Editing any variant on an approved or
 * in-review campaign forces the campaign back to "draft" and invalidates approval;
 * every save also clears this variant's own approved_manifest_hash/
 * approved_content_version, since content just changed underneath it. Rejected
 * outright once the campaign is dispatching/completed/cancelled.
 */
export async function saveVariant(supabase: any, params: SaveVariantParams): Promise<MarketingCampaignVariant> {
  // Check campaign status first
  const { data: campaign, error: campError } = await supabase
    .from("marketing_campaigns")
    .select("status")
    .eq("id", params.campaign_id)
    .single();

  if (campError || !campaign) {
    throw new Error(`Campaign not found: ${campError?.message ?? params.campaign_id}`);
  }

  if (TERMINAL_OR_INFLIGHT_STATUSES.includes(campaign.status)) {
    throw new Error(`Cannot edit a campaign in "${campaign.status}" status`);
  }

  // If approved or in_review, editing variant invalidates approval and returns to draft
  if (campaign.status === "approved" || campaign.status === "in_review") {
    await supabase
      .from("marketing_campaigns")
      .update({
        status: "draft",
        approved_by: null,
        approved_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.campaign_id);
  }

  const locale = params.locale ?? "en";
  const source_citations = params.source_citations ?? [];
  const content_hash = computeContentHash({
    subject: params.subject,
    body: params.body,
    cta_text: params.cta_text,
    cta_url: params.cta_url,
    source_snapshot: params.source_snapshot,
    source_citations,
    channel: params.channel,
    locale
  });

  const payload = {
    campaign_id: params.campaign_id,
    channel: params.channel,
    locale,
    subject: params.subject ?? null,
    body: params.body,
    cta_text: params.cta_text ?? null,
    cta_url: params.cta_url ?? null,
    source_snapshot: params.source_snapshot ?? {},
    source_citations,
    generation_provenance: params.generation_provenance ?? null,
    generation_metadata: params.generation_metadata ?? null,
    content_hash,
    // Any edit invalidates this variant's own approval stamp, independent of the
    // campaign-level status flip above.
    approved_manifest_hash: null,
    approved_content_version: null
  };

  const { data, error } = await supabase
    .from("marketing_campaign_variants")
    .upsert(payload, { onConflict: "campaign_id,channel,locale" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to save variant: ${error.message}`);
  }

  return data as MarketingCampaignVariant;
}

/**
 * Submits a draft campaign for review.
 */
export async function submitForReview(supabase: any, campaignId: string): Promise<MarketingCampaign> {
  const { data, error } = await supabase
    .from("marketing_campaigns")
    .update({
      status: "in_review",
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId)
    .eq("status", "draft")
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Cannot submit for review (must be draft): ${error?.message ?? "not found"}`);
  }

  return data as MarketingCampaign;
}

/**
 * Explicitly approves a campaign in review (or draft). Validates that the campaign has
 * at least one variant, that every email variant has a non-empty subject, and -- for
 * campaigns sourced from a published observance -- that every variant carries
 * non-empty source_citations and that the occurrence is *still* publishable right now
 * (state can have changed since the campaign was created). The status transition
 * itself is a single compare-and-set update (only "in_review"/"draft" -> "approved"
 * succeeds); if that update loses a race (already approved/cancelled/dispatching by
 * another request), it throws before any variant is touched. Once the transition
 * succeeds, each variant is stamped with the manifest hash/version approval is binding
 * to -- dispatch re-derives the same hash from the variant's *current* row and rejects
 * on mismatch.
 */
export async function approveCampaign(supabase: any, campaignId: string, approvedBy: string): Promise<MarketingCampaign> {
  const { data: campaign, error: campaignError } = await supabase
    .from("marketing_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) {
    throw new Error(`Campaign not found: ${campaignError?.message ?? campaignId}`);
  }

  const { data: variants, error: variantsError } = await supabase
    .from("marketing_campaign_variants")
    .select("*")
    .eq("campaign_id", campaignId);

  if (variantsError) {
    throw new Error(`Failed to load variants: ${variantsError.message}`);
  }

  if (!variants || variants.length === 0) {
    throw new Error("Cannot approve a campaign with no variants");
  }

  for (const variant of variants) {
    if (variant.channel === "email" && !String(variant.subject ?? "").trim()) {
      throw new Error(`Email variant (locale=${variant.locale}) requires a non-empty subject before approval`);
    }
    if (campaign.source_type === "published_observance") {
      const citations = Array.isArray(variant.source_citations) ? variant.source_citations : [];
      if (citations.length === 0) {
        throw new Error(
          `Variant ${variant.channel}/${variant.locale} is sourced from a published observance and requires non-empty source_citations before approval`
        );
      }
    }
  }

  let sourceVerifiedAt: string | null = campaign.source_verified_at ?? null;
  if (campaign.source_type === "published_observance") {
    if (!campaign.source_occurrence_id) {
      throw new Error("published_observance campaign is missing source_occurrence_id");
    }
    const occurrence = await getPublishableOccurrenceById(supabase, campaign.source_occurrence_id);
    if (!occurrence) {
      throw new Error(
        `Occurrence ${campaign.source_occurrence_id} is no longer publishable (withheld, disputed, unpublished, or unruled) -- cannot approve`
      );
    }
    sourceVerifiedAt = new Date().toISOString();
  }

  const { data: approved, error: approveError } = await supabase
    .from("marketing_campaigns")
    .update({
      status: "approved",
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      source_verified_at: sourceVerifiedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId)
    .eq("status", "in_review")
    .select("*")
    .single();

  if (approveError || !approved) {
    throw new Error(`Cannot approve campaign: ${approveError?.message ?? "must be in_review (a draft cannot be approved directly -- submit it for review first)"}`);
  }

  for (const variant of variants) {
    const manifestHash = computeContentHash({
      subject: variant.subject,
      body: variant.body,
      cta_text: variant.cta_text,
      cta_url: variant.cta_url,
      source_snapshot: variant.source_snapshot,
      source_citations: variant.source_citations,
      channel: variant.channel,
      locale: variant.locale
    });

    const { error: stampError } = await supabase
      .from("marketing_campaign_variants")
      .update({
        approved_manifest_hash: manifestHash,
        approved_content_version: variant.content_version,
      })
      .eq("id", variant.id);

    if (stampError) {
      throw new Error(`Approved campaign but failed to stamp variant ${variant.id}: ${stampError.message}`);
    }
  }

  return approved as MarketingCampaign;
}

/**
 * Cancels a campaign. Only campaigns not already in a terminal state can be cancelled
 * -- cancelling an already-completed or already-cancelled campaign is rejected rather
 * than silently succeeding again.
 */
export async function cancelCampaign(supabase: any, campaignId: string): Promise<MarketingCampaign> {
  const { data, error } = await supabase
    .from("marketing_campaigns")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId)
    .in("status", CANCELLABLE_STATUSES)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Cannot cancel campaign: ${error?.message ?? "not found, or already completed/cancelled"}`);
  }

  return data as MarketingCampaign;
}
