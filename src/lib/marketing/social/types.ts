/**
 * Types for the daily social publishing pipeline (Instagram, Facebook,
 * LinkedIn). Parallel to, but deliberately separate from,
 * src/lib/marketing/types.ts (email/WhatsApp) -- see
 * supabase/migrations/20260921024536_social_publishing_pipeline.sql for the
 * schema these mirror.
 */

export type SocialProvider = "meta" | "linkedin";
export type SocialAccountType = "facebook_page" | "instagram_business" | "linkedin_organization";
export type SocialPlatform = "instagram" | "facebook" | "linkedin";

export type SocialContentType = "festival" | "general";
export type SocialAutomationMode = "manual" | "automatic" | "paused";

export type SocialPostPipelineStage =
  | "reserved"
  | "image_ready"
  | "captions_drafted"
  | "review"
  | "approved"
  | "publishing"
  | "completed"
  | "partially_published"
  | "needs_investigation"
  | "failed"
  | "expired";

export type SocialVariantPublishStatus =
  | "pending"
  | "publishing"
  | "published"
  | "failed"
  | "outcome_unknown"
  | "expired"
  | "skipped";

export type SocialAttemptEventType =
  | "started"
  | "succeeded"
  | "rejected"
  | "unknown"
  | "reconciliation_finding";

export type SocialPostObjective = "awareness" | "learning" | "app_discovery" | "activation";

export interface SocialPublishingConfig {
  id: string;
  content_type: SocialContentType;
  automation_mode: SocialAutomationMode;
  destination_account_ids: string[];
  publish_time_local: string;
  version: number;
  updated_by: string | null;
  updated_at: string;
}

export interface SocialPublishingGlobalPause {
  id: true;
  generation_paused: boolean;
  publishing_paused: boolean;
  updated_by: string | null;
  updated_at: string;
}

export type SocialPlatformAccountStatus = "active" | "expiring_soon" | "expired" | "revoked" | "error";

export interface SocialPlatformAccount {
  id: string;
  provider: SocialProvider;
  account_type: SocialAccountType;
  external_account_id: string;
  display_name: string | null;
  access_token_enc: string | null;
  refresh_token_enc: string | null;
  key_version: number;
  token_expires_at: string | null;
  scopes: string[];
  status: SocialPlatformAccountStatus;
  last_error: string | null;
  connected_by: string;
  connected_at: string;
  last_refreshed_at: string | null;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialGeneralTheme {
  id: string;
  title: string;
  prompt_seed: string;
  grounding_material: string;
  is_active: boolean;
  display_order: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialPostSourceSnapshot {
  occurrence_id?: string;
  slug?: string;
  display_name?: string;
  date?: string;
  tradition?: string;
  description?: string;
  verified_source?: string;
  theme_id?: string;
  theme_title?: string;
  grounding_material?: string;
  [key: string]: unknown;
}

export interface SocialPost {
  id: string;
  post_key: string;
  theme_type: SocialContentType;
  source_type: "published_observance" | "general_theme";
  source_occurrence_id: string | null;
  source_general_theme_id: string | null;
  source_snapshot: SocialPostSourceSnapshot;
  source_verified_at: string | null;
  objective: SocialPostObjective;
  target_timezone: string;
  target_region: string | null;
  target_tradition: string | null;
  internal_label: string;
  pipeline_stage: SocialPostPipelineStage;
  frozen_automation_mode: SocialAutomationMode;
  frozen_destination_account_ids: string[];
  frozen_scheduled_publish_at: string;
  policy_version: number;
  scheduled_generate_at: string;
  image_asset_url: string | null;
  image_generation_provenance: Record<string, unknown> | null;
  claimed_by: string | null;
  lease_expires_at: string | null;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialPostVariant {
  id: string;
  post_id: string;
  platform: SocialPlatform;
  caption: string;
  hashtags: string[];
  cta_url: string | null;
  content_hash: string;
  content_version: number;
  approved_manifest_hash: string | null;
  approved_content_version: number | null;
  approved_image_content_hash: string | null;
  approved_source_content_hash: string | null;
  approved_platform_account_id: string | null;
  generation_provenance: Record<string, unknown> | null;
  source_citations: unknown[];
  generation_metadata: Record<string, unknown> | null;
  generation_attempt_count: number;
  publish_status: SocialVariantPublishStatus;
  provider_request_id: string | null;
  platform_intermediate_ref: string | null;
  external_post_id: string | null;
  permalink_url: string | null;
  published_at: string | null;
  last_error_code: string | null;
  attempt_count: number;
  created_at: string;
  updated_at: string;
}

export interface SocialPublishAttempt {
  id: string;
  attempt_id: string;
  variant_id: string;
  event_type: SocialAttemptEventType;
  provider_request_id: string | null;
  platform_intermediate_ref: string | null;
  external_post_id: string | null;
  permalink_url: string | null;
  error_summary: string | null;
  created_by: string | null;
  created_at: string;
}

/** Result of a publisher's send call -- never throws for an ordinary failure; a thrown
 * error from a publisher always means "uncertain," matching sendResult.outcome === "unknown". */
export interface PublisherSendResult {
  outcome: "succeeded" | "rejected" | "unknown";
  providerRequestId?: string | null;
  platformIntermediateRef?: string | null;
  externalPostId?: string | null;
  permalinkUrl?: string | null;
  errorSummary?: string | null;
}

export interface PublisherSendInput {
  account: SocialPlatformAccount;
  accessToken: string;
  caption: string;
  hashtags: string[];
  ctaUrl: string | null;
  imageUrl: string;
  idempotencyKey: string;
}
