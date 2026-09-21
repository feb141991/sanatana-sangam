/**
 * Stage-advance orchestration for the social publishing pipeline. Each
 * function here claims a post via claim_social_post_stage (optimistic
 * lease, mirrors claim_marketing_dispatches) before doing any work, so two
 * overlapping tick invocations -- or a tick overlapping a manual admin
 * action -- can never both act on the same post.
 *
 * Publish-time safety (approved plan section 2) lives entirely in
 * publishApprovedPost: the started-event invariant (enforced by the
 * start_social_publish_attempt RPC, not by the lease alone), the live
 * publishing_paused check immediately before each send, the scheduled-
 * window check, and per-destination expiry that never overwrites an
 * unresolved outcome.
 */
import crypto from "crypto";
import { decryptSocialToken } from "./token-crypto";
import { draftSocialCaption, GenerationPausedError } from "./caption-generator";
import { publishToFacebookPage, publishToInstagram } from "./publishers/meta";
import { publishToLinkedIn } from "./publishers/linkedin";
import { uploadDraftSocialImage, getSignedDraftImageUrl, getDraftImageContentHash, releaseApprovedSocialImage } from "./image-storage";
import { computeSocialVariantContentHash } from "./content-hash";
import type {
  SocialPost,
  SocialPostVariant,
  SocialPlatformAccount,
  PublisherSendResult,
  PublisherSendInput
} from "./types";

const PUBLISH_EXPIRY_GRACE_HOURS = 20; // a festival greeting should not go out a day late

function workerToken(prefix: string): string {
  return `${prefix}:${crypto.randomUUID()}`;
}

function sanitizeErrorSummary(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  return raw.replace(/Bearer\s+\S+/gi, "Bearer [redacted]").slice(0, 500);
}

async function claimStage(supabase: any, postId: string, expectedStage: string, token: string, leaseSeconds = 300): Promise<SocialPost | null> {
  const { data, error } = await supabase.rpc("claim_social_post_stage", {
    p_post_id: postId,
    p_expected_stage: expectedStage,
    p_worker_token: token,
    p_lease_seconds: leaseSeconds
  });
  if (error) throw new Error(`claim_social_post_stage failed: ${error.message}`);
  return (data as SocialPost) ?? null;
}

async function isPublishingPaused(supabase: any): Promise<boolean> {
  const { data, error } = await supabase
    .from("social_publishing_global_pause")
    .select("publishing_paused")
    .eq("id", true)
    .maybeSingle();
  if (error) throw new Error(`Failed to read social_publishing_global_pause: ${error.message}`);
  return Boolean(data?.publishing_paused);
}

// ─── Admin-driven: attach an image to a still-'reserved' post ──────────────

export async function attachImageToPost(
  supabase: any,
  postId: string,
  imageBytes: ArrayBuffer,
  contentType: string
): Promise<SocialPost> {
  const { draftPath, contentHash } = await uploadDraftSocialImage(supabase, postId, imageBytes, contentType);

  const { data, error } = await supabase
    .from("social_posts")
    .update({ image_asset_url: draftPath, image_generation_provenance: { source: "admin_upload", content_hash: contentHash } })
    .eq("id", postId)
    .eq("pipeline_stage", "reserved")
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Cannot attach image: post is not in 'reserved' stage or does not exist (${error?.message ?? "no matching row"})`);
  }

  const { error: stageError } = await supabase
    .from("social_posts")
    .update({ pipeline_stage: "image_ready" })
    .eq("id", postId)
    .eq("pipeline_stage", "reserved");

  if (stageError) throw new Error(`Failed to advance post to image_ready: ${stageError.message}`);

  return { ...(data as SocialPost), pipeline_stage: "image_ready" };
}

export async function getDraftImagePreviewUrl(supabase: any, post: SocialPost): Promise<string | null> {
  if (!post.image_asset_url) return null;
  return getSignedDraftImageUrl(supabase, post.image_asset_url);
}

// ─── Automated: draft captions for every variant of an image_ready post ────

export async function advancePostCaptions(supabase: any, postId: string): Promise<{ advanced: boolean; reason: string }> {
  const post = await claimStage(supabase, postId, "image_ready", workerToken("captions"));
  if (!post) return { advanced: false, reason: "not_claimable" };

  const { data: variants, error: variantsError } = await supabase
    .from("social_post_variants")
    .select("*")
    .eq("post_id", postId);
  if (variantsError) throw new Error(`Failed to load variants for captioning: ${variantsError.message}`);

  let anyFailed = false;
  for (const variant of (variants ?? []) as SocialPostVariant[]) {
    if (variant.caption?.trim()) continue;

    try {
      const draft = await draftSocialCaption(supabase, {
        platform: variant.platform,
        themeType: post.theme_type,
        sourceSnapshot: post.source_snapshot,
        objective: post.objective,
        targetTradition: post.target_tradition
      });

      const sourceCitations = post.source_type === "published_observance"
        ? [{ source: post.source_snapshot.verified_source ?? "CANONICAL_RULES", occurrence_id: post.source_occurrence_id }]
        : [{ source: "admin_grounding_material", theme_id: post.source_general_theme_id }];

      await supabase
        .from("social_post_variants")
        .update({
          caption: draft.caption,
          hashtags: draft.hashtags,
          cta_url: draft.ctaUrl,
          source_citations: sourceCitations,
          content_hash: computeSocialVariantContentHash({
            platform: variant.platform,
            caption: draft.caption,
            hashtags: draft.hashtags,
            cta_url: draft.ctaUrl,
            source_citations: sourceCitations
          }),
          generation_provenance: { model_used: draft.modelUsed, provider: draft.provider, generated_at: new Date().toISOString() },
          generation_attempt_count: variant.generation_attempt_count + 1
        })
        .eq("id", variant.id);
    } catch (err) {
      anyFailed = true;
      if (err instanceof GenerationPausedError) {
        // Release the lease immediately (do not hold a 5-minute lock while
        // paused) and stop -- nothing new should generate while paused.
        await supabase.from("social_posts").update({ claimed_by: null, lease_expires_at: null }).eq("id", postId);
        return { advanced: false, reason: "generation_paused" };
      }
      await supabase
        .from("social_post_variants")
        .update({ generation_attempt_count: variant.generation_attempt_count + 1 })
        .eq("id", variant.id);
    }
  }

  const nextStage = anyFailed ? "captions_drafted" : "review";
  await supabase
    .from("social_posts")
    .update({ pipeline_stage: nextStage, claimed_by: null, lease_expires_at: null })
    .eq("id", postId);

  return { advanced: true, reason: nextStage };
}

// ─── Admin-driven: approve a reviewed post ──────────────────────────────────

export async function approvePost(
  supabase: any,
  postId: string,
  approvedBy: string,
  variantAccountAssignments: Record<string, string> // variant_id -> platform_account_id
): Promise<SocialPost> {
  const { data: post, error: postError } = await supabase.from("social_posts").select("*").eq("id", postId).single();
  if (postError || !post) throw new Error("Post not found");
  const typedPost = post as SocialPost;

  if (typedPost.pipeline_stage !== "review" && typedPost.pipeline_stage !== "captions_drafted") {
    throw new Error(`Cannot approve a post in '${typedPost.pipeline_stage}' stage`);
  }
  if (!typedPost.image_asset_url) {
    throw new Error("Cannot approve a post with no image attached");
  }

  const { data: variants, error: variantsError } = await supabase
    .from("social_post_variants")
    .select("*")
    .eq("post_id", postId);
  if (variantsError) throw new Error(variantsError.message);

  const draftBytesHash = await getDraftImageContentHash(supabase, typedPost.image_asset_url!);

  for (const variant of (variants ?? []) as SocialPostVariant[]) {
    if (!variant.caption?.trim()) {
      throw new Error(`Variant ${variant.platform} has no caption -- cannot approve`);
    }
    const accountId = variantAccountAssignments[variant.id];
    if (!accountId) {
      throw new Error(`No destination account assigned for variant ${variant.platform}`);
    }

    // Recomputed fresh, never trusting the stored content_hash column --
    // matches dispatcher.ts's variantMatchesApprovedManifest convention of
    // re-deriving from the current row rather than a value that could be
    // stale if some write path forgot to update it.
    const freshContentHash = computeSocialVariantContentHash({
      platform: variant.platform,
      caption: variant.caption,
      hashtags: variant.hashtags,
      cta_url: variant.cta_url,
      source_citations: variant.source_citations
    });

    await supabase
      .from("social_post_variants")
      .update({
        content_hash: freshContentHash,
        approved_manifest_hash: freshContentHash,
        approved_content_version: variant.content_version,
        approved_image_content_hash: draftBytesHash,
        approved_source_content_hash: crypto.createHash("sha256").update(JSON.stringify(typedPost.source_snapshot)).digest("hex"),
        approved_platform_account_id: accountId
      })
      .eq("id", variant.id);
  }

  const { data: updated, error: approveError } = await supabase
    .from("social_posts")
    .update({ pipeline_stage: "approved", approved_by: approvedBy, approved_at: new Date().toISOString() })
    .eq("id", postId)
    .in("pipeline_stage", ["review", "captions_drafted"])
    .select("*")
    .single();

  if (approveError || !updated) {
    throw new Error(`Failed to approve post (stage changed concurrently?): ${approveError?.message ?? "not found"}`);
  }

  return updated as SocialPost;
}

// ─── Publish a single variant, with all send-time safety checks ────────────

async function getDecryptedAccessToken(account: SocialPlatformAccount): Promise<string> {
  if (!account.access_token_enc) throw new Error(`Account ${account.id} has no stored access token`);
  return decryptSocialToken(account.access_token_enc, account.key_version);
}

async function sendVariant(
  supabase: any,
  variant: SocialPostVariant,
  account: SocialPlatformAccount,
  publicImageUrl: string
): Promise<void> {
  const accessToken = await getDecryptedAccessToken(account);
  const attemptId = crypto.randomUUID();
  const idempotencyKey = `${variant.id}:${attemptId}`;

  const { error: startError } = await supabase.rpc("start_social_publish_attempt", {
    p_variant_id: variant.id,
    p_attempt_id: attemptId,
    p_worker_token: workerToken("publish")
  });
  if (startError) {
    // An unresolved prior attempt exists -- do NOT send. A database-level
    // ownership decision cannot cancel a request already traveling to the
    // platform, so the only safe move is to leave it for investigation.
    throw new Error(`Refusing to send: ${startError.message}`);
  }

  const input: PublisherSendInput = {
    account,
    accessToken,
    caption: variant.caption,
    hashtags: variant.hashtags,
    ctaUrl: variant.cta_url,
    imageUrl: publicImageUrl,
    idempotencyKey
  };

  let result: PublisherSendResult;
  try {
    if (variant.platform === "facebook") result = await publishToFacebookPage(input);
    else if (variant.platform === "instagram") result = await publishToInstagram(input);
    else result = await publishToLinkedIn(input);
  } catch (err) {
    result = { outcome: "unknown", errorSummary: sanitizeErrorSummary(err) };
  }

  const eventType = result.outcome === "succeeded" ? "succeeded" : result.outcome === "rejected" ? "rejected" : "unknown";

  const { error: resultError } = await supabase.rpc("record_social_publish_result", {
    p_attempt_id: attemptId,
    p_variant_id: variant.id,
    p_event_type: eventType,
    p_provider_request_id: result.providerRequestId ?? null,
    p_platform_intermediate_ref: result.platformIntermediateRef ?? null,
    p_external_post_id: result.externalPostId ?? null,
    p_permalink_url: result.permalinkUrl ?? null,
    p_error_summary: result.errorSummary ?? null
  });
  if (resultError) {
    throw new Error(`Send completed (outcome=${result.outcome}) but failed to record result: ${resultError.message}`);
  }
}

// ─── Publish an approved post: window check, pause check, per-variant expiry

export interface PublishOutcome {
  attempted: boolean;
  reason: string;
}

export async function publishApprovedPost(
  supabase: any,
  postId: string,
  options: { manualPublishNow: boolean; triggeredBy: string }
): Promise<PublishOutcome> {
  const post = await claimStage(supabase, postId, "approved", workerToken("publish-post"));
  if (!post) return { attempted: false, reason: "not_claimable" };

  const now = new Date();
  const scheduledAt = new Date(post.frozen_scheduled_publish_at);
  const expiryDeadline = new Date(scheduledAt.getTime() + PUBLISH_EXPIRY_GRACE_HOURS * 3600 * 1000);

  if (!options.manualPublishNow) {
    if (now < scheduledAt) {
      await supabase.from("social_posts").update({ claimed_by: null, lease_expires_at: null }).eq("id", postId);
      return { attempted: false, reason: "not_yet_scheduled_time" };
    }
  }

  await supabase.from("social_posts").update({ pipeline_stage: "publishing" }).eq("id", postId).eq("pipeline_stage", "approved");

  const { data: variants, error: variantsError } = await supabase
    .from("social_post_variants")
    .select("*, social_platform_accounts:approved_platform_account_id(*)")
    .eq("post_id", postId);
  if (variantsError) throw new Error(variantsError.message);

  const publicImage = await releaseApprovedSocialImage(supabase, post.image_asset_url!);
  const currentSourceHash = crypto.createHash("sha256").update(JSON.stringify(post.source_snapshot)).digest("hex");

  for (const row of (variants ?? []) as Array<SocialPostVariant & { social_platform_accounts: SocialPlatformAccount }>) {
    if (row.publish_status !== "pending") continue; // already published/failed/skipped/outcome_unknown -- leave alone

    // Stale-approval check (plan section 7): any change to image bytes,
    // caption/hashtags/cta_url, or source content since approval
    // invalidates that specific variant's approval. Never sent on a guess
    // -- re-derived fresh from current rows, exactly what was approved.
    const freshManifestHash = computeSocialVariantContentHash({
      platform: row.platform,
      caption: row.caption,
      hashtags: row.hashtags,
      cta_url: row.cta_url,
      source_citations: row.source_citations
    });
    const staleReason =
      freshManifestHash !== row.approved_manifest_hash
        ? "caption_or_hashtags_changed_since_approval"
        : publicImage.contentHash !== row.approved_image_content_hash
        ? "image_changed_since_approval"
        : currentSourceHash !== row.approved_source_content_hash
        ? "source_content_changed_since_approval"
        : null;

    if (staleReason) {
      await supabase.from("social_post_variants").update({ publish_status: "skipped", last_error_code: staleReason }).eq("id", row.id).eq("publish_status", "pending");
      continue;
    }

    // Live pause check, immediately before this specific send -- even for
    // an already-approved post, per the plan's correction.
    if (await isPublishingPaused(supabase)) {
      continue; // leave as 'pending'; picked up again once unpaused
    }

    // Per-destination expiry: only applied when nothing was ever attempted
    // (publish_status is still 'pending' here, so no started event exists
    // yet for this variant) and never overwrites an unresolved outcome.
    if (!options.manualPublishNow && now > expiryDeadline) {
      await supabase.from("social_post_variants").update({ publish_status: "expired" }).eq("id", row.id).eq("publish_status", "pending");
      continue;
    }

    if (!row.social_platform_accounts) {
      await supabase.from("social_post_variants").update({ publish_status: "skipped", last_error_code: "no_account_assigned" }).eq("id", row.id);
      continue;
    }

    try {
      await sendVariant(supabase, row, row.social_platform_accounts, publicImage.publicUrl);
    } catch (err) {
      // start_social_publish_attempt refused (unresolved prior attempt) or
      // an unexpected error before a result could be recorded -- leave the
      // variant's status exactly as it is; do not guess.
      console.error(`[social-pipeline] send failed for variant ${row.id}: ${sanitizeErrorSummary(err)}`);
    }
  }

  await supabase.from("social_posts").update({ claimed_by: null, lease_expires_at: null }).eq("id", postId);
  return { attempted: true, reason: "processed" };
}
