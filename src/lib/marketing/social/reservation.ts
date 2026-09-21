/**
 * Reservation: the one place a new social_posts row is created, and the one
 * place policy is frozen onto it (approved plan sections 1, 2, 9). Every
 * later pipeline stage reads the frozen_* columns this writes -- it never
 * re-resolves social_publishing_config live.
 *
 * Idempotent by construction: post_key is `social:<content_type>:<date>`,
 * unique in the DB (see the migration). A second call for the same day/type
 * hits a unique-violation on insert and is treated as "already reserved,"
 * not an error -- this is what lets the tick route call this on every run
 * without needing its own "did I already reserve today" bookkeeping.
 *
 * One post per content_type per day: festival and general are reserved
 * independently, each gated by its own social_publishing_config row's
 * automation_mode and its own candidate availability. A day can produce
 * zero, one, or two posts (one per content_type) -- there is no cross-type
 * "only one per day total" rule, since each content_type has its own
 * destinations and its own admin-controlled automation mode.
 */
import { selectFestivalCandidate, selectGeneralThemeCandidate } from "./theme-selector";
import { zonedTimeToUtcIso } from "./schedule-time";
import { computeSocialVariantContentHash } from "./content-hash";
import type {
  SocialContentType,
  SocialPost,
  SocialPostVariant,
  SocialPlatform,
  SocialPlatformAccount,
  SocialPublishingConfig
} from "./types";

const ACCOUNT_TYPE_TO_PLATFORM: Record<SocialPlatformAccount["account_type"], SocialPlatform> = {
  facebook_page: "facebook",
  instagram_business: "instagram",
  linkedin_organization: "linkedin"
};

export interface ReservationOutcome {
  reserved: boolean;
  reason: string;
  post?: SocialPost;
}

export async function isGenerationPaused(supabase: any): Promise<boolean> {
  const { data, error } = await supabase
    .from("social_publishing_global_pause")
    .select("generation_paused")
    .eq("id", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read social_publishing_global_pause: ${error.message}`);
  }
  return Boolean(data?.generation_paused);
}

async function getConfig(supabase: any, contentType: SocialContentType): Promise<SocialPublishingConfig | null> {
  const { data, error } = await supabase
    .from("social_publishing_config")
    .select("*")
    .eq("content_type", contentType)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read social_publishing_config(${contentType}): ${error.message}`);
  }
  return (data as SocialPublishingConfig) ?? null;
}

async function resolveDestinationPlatforms(
  supabase: any,
  destinationAccountIds: string[]
): Promise<Array<{ platform: SocialPlatform; accountId: string }>> {
  if (destinationAccountIds.length === 0) return [];

  const { data, error } = await supabase
    .from("social_platform_accounts")
    .select("id, account_type, status")
    .in("id", destinationAccountIds);

  if (error) {
    throw new Error(`Failed to resolve destination platform accounts: ${error.message}`);
  }

  return ((data ?? []) as Array<Pick<SocialPlatformAccount, "id" | "account_type" | "status">>)
    .filter(row => row.status === "active")
    .map(row => ({ platform: ACCOUNT_TYPE_TO_PLATFORM[row.account_type], accountId: row.id }));
}

export interface ReserveSocialPostParams {
  contentType: SocialContentType;
  targetDate: string; // "YYYY-MM-DD"
  targetTimezone: string;
  targetRegion?: string | null;
  targetTradition?: string | null;
  objective: SocialPost["objective"];
  createdBy: string;
}

export async function reserveSocialPost(
  supabase: any,
  params: ReserveSocialPostParams
): Promise<ReservationOutcome> {
  if (await isGenerationPaused(supabase)) {
    return { reserved: false, reason: "generation_paused" };
  }

  const config = await getConfig(supabase, params.contentType);
  if (!config) {
    return { reserved: false, reason: "no_config_row" };
  }
  if (config.automation_mode === "paused") {
    return { reserved: false, reason: "content_type_paused" };
  }

  const postKey = `social:${params.contentType}:${params.targetDate}`;

  let sourceOccurrenceId: string | null = null;
  let sourceGeneralThemeId: string | null = null;
  let sourceSnapshot: SocialPost["source_snapshot"] = {};
  let sourceType: SocialPost["source_type"];

  if (params.contentType === "festival") {
    const candidate = await selectFestivalCandidate(supabase, params.targetDate, params.targetTradition ?? null);
    if (!candidate) {
      return { reserved: false, reason: "no_qualifying_festival_for_date" };
    }
    sourceOccurrenceId = candidate.sourceOccurrenceId;
    sourceSnapshot = candidate.snapshot;
    sourceType = "published_observance";
  } else {
    const candidate = await selectGeneralThemeCandidate(supabase);
    if (!candidate) {
      return { reserved: false, reason: "no_eligible_general_theme" };
    }
    sourceGeneralThemeId = candidate.themeId;
    sourceSnapshot = candidate.snapshot;
    sourceType = "general_theme";
  }

  const destinations = await resolveDestinationPlatforms(supabase, config.destination_account_ids);
  if (destinations.length === 0) {
    return { reserved: false, reason: "no_connected_destination_accounts" };
  }

  if (!config.publish_time_local) {
    return { reserved: false, reason: "no_publish_time_configured" };
  }

  const frozenScheduledPublishAt = zonedTimeToUtcIso(
    params.targetDate,
    config.publish_time_local,
    params.targetTimezone
  );

  const label = params.contentType === "festival"
    ? `Festival — ${sourceSnapshot.display_name ?? "Untitled"} — ${params.targetDate}`
    : `General — ${sourceSnapshot.theme_title ?? "Untitled"} — ${params.targetDate}`;

  const { data: inserted, error: insertError } = await supabase
    .from("social_posts")
    .insert({
      post_key: postKey,
      theme_type: params.contentType,
      source_type: sourceType,
      source_occurrence_id: sourceOccurrenceId,
      source_general_theme_id: sourceGeneralThemeId,
      source_snapshot: sourceSnapshot,
      source_verified_at: new Date().toISOString(),
      objective: params.objective,
      target_timezone: params.targetTimezone,
      target_region: params.targetRegion ?? null,
      target_tradition: params.targetTradition ?? null,
      internal_label: label,
      pipeline_stage: "reserved",
      frozen_automation_mode: config.automation_mode,
      frozen_destination_account_ids: config.destination_account_ids,
      frozen_scheduled_publish_at: frozenScheduledPublishAt,
      policy_version: config.version,
      scheduled_generate_at: new Date().toISOString(),
      created_by: params.createdBy
    })
    .select("*")
    .single();

  if (insertError) {
    // 23505 = unique_violation on post_key -- another tick/call already reserved
    // this content_type/date. Not an error: idempotent no-op.
    if (insertError.code === "23505") {
      return { reserved: false, reason: "already_reserved_for_date" };
    }
    throw new Error(`Failed to reserve social post: ${insertError.message}`);
  }

  const post = inserted as SocialPost;

  if (sourceGeneralThemeId) {
    await supabase
      .from("social_general_themes")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", sourceGeneralThemeId);
  }

  const variantRows = destinations.map(dest => ({
    post_id: post.id,
    platform: dest.platform,
    caption: "",
    hashtags: [],
    cta_url: null,
    content_hash: computeSocialVariantContentHash({
      platform: dest.platform,
      caption: "",
      hashtags: [],
      cta_url: null,
      source_citations: []
    }),
    publish_status: "pending" as const
  }));

  const { error: variantsError } = await supabase.from("social_post_variants").insert(variantRows);
  if (variantsError) {
    throw new Error(`Reserved post ${post.id} but failed to create variants: ${variantsError.message}`);
  }

  return { reserved: true, reason: "reserved", post };
}
