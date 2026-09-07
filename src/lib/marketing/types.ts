/**
 * Canonical Marketing Pipeline Types & Data Contracts.
 * Governs campaigns, variants, audience eligibility, and idempotent dispatches.
 */

export type MarketingCampaignStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "dispatching"
  | "completed"
  | "cancelled";

export type MarketingChannel = "email" | "whatsapp";
export type DeferredMarketingChannel = "linkedin" | "twitter" | "instagram";

export type MarketingSourceType = "manual" | "published_observance";

export type MarketingDispatchStatus =
  | "pending"
  | "claimed"
  | "sent"
  | "failed"
  | "suppressed";

export interface MarketingCampaign {
  id: string;
  campaign_key: string;
  campaign_type: "newsletter" | "festival_reminder" | "announcement";
  title: string;
  status: MarketingCampaignStatus;
  source_type: MarketingSourceType;
  source_occurrence_id: string | null;
  // Set only by server-side re-validation against the canonical occurrence filter
  // (createCampaign / approveCampaign) -- never client-settable. Null means "not a
  // published_observance campaign" or "not yet (re-)verified."
  source_verified_at: string | null;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketingSourceSnapshot {
  occurrence_id?: string;
  slug?: string;
  display_name?: string;
  date?: string;
  tradition?: string;
  description?: string;
  verified_source?: string;
  [key: string]: unknown;
}

export interface MarketingCampaignVariant {
  id: string;
  campaign_id: string;
  channel: MarketingChannel;
  locale: string;
  subject: string | null;
  body: string;
  cta_text: string | null;
  cta_url: string | null;
  source_snapshot: MarketingSourceSnapshot;
  content_hash: string;
  // Database-maintained: 1 on first insert, incremented whenever a manifest-relevant
  // field changes (never by a pure approval-stamp update). See
  // bump_marketing_variant_content_version() in the marketing_pipeline migration.
  content_version: number;
  // Snapshot of content_hash/content_version taken at the moment approveCampaign
  // succeeded. Null means "not currently approved" -- cleared by saveVariant on any
  // edit. Dispatch recomputes content_hash from the current row and rejects if it no
  // longer matches approved_manifest_hash.
  approved_manifest_hash: string | null;
  approved_content_version: number | null;
  generation_provenance: Record<string, unknown> | null;
  source_citations: unknown[];
  generation_metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface MarketingDispatch {
  id: string;
  campaign_id: string;
  variant_id: string;
  recipient_user_id: string;
  channel: MarketingChannel;
  status: MarketingDispatchStatus;
  provider: string;
  provider_message_id: string | null;
  attempt_count: number;
  last_error_code: string | null;
  claimed_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsentDecision {
  eligible: boolean;
  reasonCode:
    | "eligible"
    | "missing_marketing_consent"
    | "email_newsletter_disabled"
    | "email_festivals_disabled"
    | "whatsapp_opt_in_disabled"
    | "invalid_whatsapp_number"
    | "missing_email"
    | "placeholder_email"
    | "account_banned"
    | "account_deleted"
    | "uncertain_consent"
    | "unsupported_channel";
}

export interface RecipientProfile {
  id: string;
  email?: string | null;
  whatsapp_number?: string | null;
  full_name?: string | null;
  marketing_consent?: boolean | null;
  email_newsletter?: boolean | null;
  email_festivals?: boolean | null;
  whatsapp_opt_in?: boolean | null;
  whatsapp_updates?: boolean | null;
  unsubscribe_token?: string | null;
  is_banned?: boolean | null;
}
