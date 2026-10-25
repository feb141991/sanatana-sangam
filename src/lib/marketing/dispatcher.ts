import { evaluateMarketingConsent } from "./consent";
import { computeContentHash } from "./campaign-service";
import { sendShoonayaEmail } from "@/lib/email";
import { APP } from "@/lib/config";
import { createWhatsAppProvider } from "@/lib/whatsapp/provider";
import { resolveRecipientEmails } from "@/lib/server/recipient-emails";
import { resolveCampaignCtaUrl, trackLinksInText, withCampaignTracking, type LinkContext } from "./campaign-links";
import type {
  MarketingCampaign,
  MarketingCampaignVariant,
  MarketingChannel,
  MarketingDispatch,
  RecipientProfile
} from "./types";

export interface DispatchBatchOptions {
  campaign: MarketingCampaign;
  variant: MarketingCampaignVariant;
  dryRun?: boolean;
  /** Max dispatch rows to claim (live) or preview (dry run) per call. */
  claimLimit?: number;
  /** Email lease timeout; expired WhatsApp claims are quarantined instead of resent. */
  leaseMinutes?: number;
}

export interface DispatchResult {
  total: number;
  sent: number;
  suppressed: number;
  failed: number;
  retryable: number;
  outcomeUnknown: number;
  dryRun: boolean;
  dispatches: Array<{
    recipient_user_id: string;
    channel: MarketingChannel;
    status: "sent" | "retryable" | "outcome_unknown" | "failed" | "suppressed";
    provider_message_id?: string | null;
    error_code?: string | null;
  }>;
}

type DispatchResolutionStatus = Extract<
  MarketingDispatch["status"],
  "sent" | "retryable" | "outcome_unknown" | "failed" | "suppressed"
>;

interface DispatchResolution {
  status: DispatchResolutionStatus;
  provider?: string | null;
  providerMessageId?: string | null;
  errorCode?: string | null;
}

async function resolveClaim(
  supabase: any,
  row: MarketingDispatch,
  resolution: DispatchResolution
): Promise<void> {
  if (!row.claim_token) {
    throw new Error("Claimed marketing dispatch is missing its claim token");
  }

  const { data, error } = await supabase.rpc("resolve_marketing_dispatch", {
    p_dispatch_id: row.id,
    p_claim_token: row.claim_token,
    p_status: resolution.status,
    p_provider: resolution.provider ?? null,
    p_provider_message_id: resolution.providerMessageId ?? null,
    p_error_code: resolution.errorCode ?? null,
  });
  const resolved = Array.isArray(data) ? data[0] : data;
  if (error || !resolved) {
    throw new Error("Marketing dispatch ledger finalization failed");
  }
}

/**
 * Sanitizes provider error messages into short, safe error codes.
 * Strips all secrets, tokens, and recipient identifiers.
 */
export function sanitizeErrorCode(error: unknown): string {
  if (!error) return "unknown_error";
  const raw = typeof error === "object" && error !== null && "message" in error
    ? String((error as any).message)
    : String(error);

  const lower = raw.toLowerCase();
  if (lower.includes("rate") || lower.includes("429")) return "rate_limited";
  if (lower.includes("auth") || lower.includes("key") || lower.includes("401") || lower.includes("403")) return "auth_failed";
  if (lower.includes("invalid") || lower.includes("400")) return "invalid_recipient";
  if (lower.includes("not found") || lower.includes("404")) return "not_found";
  if (lower.includes("timeout") || lower.includes("504")) return "timeout";
  return "provider_error";
}

/**
 * Recomputes a variant's manifest hash from its *current* row and compares it to what
 * was approved. A mismatch means content changed after approval (saveVariant already
 * clears approved_manifest_hash on any edit, but this is the actual enforcement point
 * -- dispatch, not just approval bookkeeping).
 */
export function variantMatchesApprovedManifest(variant: MarketingCampaignVariant): boolean {
  if (!variant.approved_manifest_hash) return false;
  const currentHash = computeContentHash({
    subject: variant.subject,
    body: variant.body,
    cta_text: variant.cta_text,
    cta_url: variant.cta_url,
    source_snapshot: variant.source_snapshot,
    source_citations: variant.source_citations,
    channel: variant.channel,
    locale: variant.locale
  });
  return currentHash === variant.approved_manifest_hash;
}

async function fetchRecipientProfiles(
  supabase: any,
  userIds: string[],
  channel: MarketingChannel
): Promise<Record<string, RecipientProfile>> {
  if (userIds.length === 0) return {};

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, tradition, marketing_consent, email_newsletter, email_festivals, whatsapp_opt_in, whatsapp_number, unsubscribe_token, is_banned"
    )
    .in("id", userIds);

  if (error) {
    throw new Error(`Failed to load recipient profiles for dispatch: ${error.message}`);
  }

  const rows = (data ?? []) as Array<RecipientProfile & { id: string }>;
  const emailByUserId = channel === "email" ? await resolveRecipientEmails(supabase, userIds) : {};

  const byId: Record<string, RecipientProfile> = {};
  for (const row of rows) {
    byId[row.id] = channel === "email" ? { ...row, email: emailByUserId[row.id] ?? null } : row;
  }
  return byId;
}

/**
 * Executes idempotent, consent-checked campaign dispatch for one channel/variant.
 * Default mode: DRY RUN, which makes zero provider calls and zero delivery-state
 * writes -- it previews the same candidate rows a live call would claim and runs the
 * same consent evaluation, without ever calling claim_marketing_dispatches (so a
 * dry-run can never itself claim a row out from under a later live call).
 *
 * The live path claims a bounded batch via the atomic claim_marketing_dispatches RPC
 * (FOR UPDATE SKIP LOCKED, token-bound resolution) -- only the worker holding the
 * current claim token may finalize it. Email claims may be retried because Resend
 * receives a stable idempotency key. Expired WhatsApp claims are quarantined for
 * reconciliation because this integration has no equivalent provider guarantee.
 */
export async function dispatchMarketingBatch(
  supabase: any,
  options: DispatchBatchOptions
): Promise<DispatchResult> {
  const { campaign, variant, dryRun = true, claimLimit = 50, leaseMinutes = 15 } = options;

  if (campaign.status !== "approved" && campaign.status !== "dispatching") {
    throw new Error(`Cannot dispatch campaign in "${campaign.status}" status (must be approved)`);
  }

  if (!variantMatchesApprovedManifest(variant)) {
    throw new Error(
      "Variant content no longer matches its approved manifest (edited since approval) -- re-approve before dispatching"
    );
  }

  const result: DispatchResult = {
    total: 0,
    sent: 0,
    suppressed: 0,
    failed: 0,
    retryable: 0,
    outcomeUnknown: 0,
    dryRun,
    dispatches: []
  };

  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  const whatsappProvider = createWhatsAppProvider();

  // If in production and WhatsApp provider is mock, fail closed
  if (!dryRun && variant.channel === "whatsapp" && isProduction && whatsappProvider.isMock) {
    throw new Error("Cannot dispatch WhatsApp marketing campaign in production using mock provider (fail closed).");
  }

  if (dryRun) {
    const { data: previewRows, error: previewError } = await supabase
      .from("marketing_dispatches")
      .select("id, recipient_user_id")
      .eq("campaign_id", campaign.id)
      .eq("variant_id", variant.id)
      .eq("channel", variant.channel)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(claimLimit);

    if (previewError) {
      throw new Error(`Failed to preview dispatch batch: ${previewError.message}`);
    }

    const rows = (previewRows ?? []) as Array<{ id: string; recipient_user_id: string }>;
    result.total = rows.length;

    const profilesById = await fetchRecipientProfiles(
      supabase,
      rows.map(r => r.recipient_user_id),
      variant.channel
    );

    for (const row of rows) {
      const profile = profilesById[row.recipient_user_id] ?? null;
      const consent = evaluateMarketingConsent(profile, variant.channel, campaign.campaign_type);

      if (consent.eligible) {
        result.sent++;
        result.dispatches.push({
          recipient_user_id: row.recipient_user_id,
          channel: variant.channel,
          status: "sent",
          provider_message_id: `dry-run-${row.recipient_user_id.slice(0, 8)}`
        });
      } else {
        result.suppressed++;
        result.dispatches.push({
          recipient_user_id: row.recipient_user_id,
          channel: variant.channel,
          status: "suppressed",
          error_code: consent.reasonCode
        });
      }
    }

    return result;
  }

  const { data: claimed, error: claimError } = await supabase.rpc("claim_marketing_dispatches", {
    p_campaign_id: campaign.id,
    p_variant_id: variant.id,
    p_channel: variant.channel,
    p_limit: claimLimit,
    p_lease_minutes: leaseMinutes
  });

  if (claimError) {
    throw new Error(`Failed to claim dispatch batch: ${claimError.message}`);
  }

  const rows = (claimed ?? []) as MarketingDispatch[];
  result.total = rows.length;
  if (rows.length === 0) {
    return result;
  }

  // Every Shoonaya link in what goes out is tagged with this campaign (UTM), so installs and visits can be
  // traced back to the message. Applied at send time: the approved copy itself is not changed.
  const linkContext: LinkContext = { channel: variant.channel, campaign: campaign.campaign_key, content: variant.locale };

  const profilesById = await fetchRecipientProfiles(
    supabase,
    rows.map(r => r.recipient_user_id),
    variant.channel
  );

  for (const row of rows) {
    // 1. Live consent re-check, immediately before the provider call, using the
    //    freshest profile state -- a claim can only have happened moments ago, but
    //    consent could still have changed in that window.
    const profile = profilesById[row.recipient_user_id] ?? null;
    const consent = evaluateMarketingConsent(profile, variant.channel, campaign.campaign_type);

    if (!consent.eligible) {
      result.suppressed++;
      result.dispatches.push({
        recipient_user_id: row.recipient_user_id,
        channel: variant.channel,
        status: "suppressed",
        error_code: consent.reasonCode
      });
      await resolveClaim(supabase, row, {
        status: "suppressed",
        errorCode: consent.reasonCode,
      });
      continue;
    }

    // 2. Real provider dispatch. The claimed row's own id is passed where the
    //    provider supports an idempotency key, so a retried call after an uncertain
    //    response is deduped provider-side too, not just by this row's own status.
    let resolution: DispatchResolution;
    if (variant.channel === "email") {
      try {
        let unsubscribeUrl: string | undefined;
        if (profile!.unsubscribe_token) {
          const url = new URL("/api/unsubscribe", APP.BASE_URL);
          url.searchParams.set("token", profile!.unsubscribe_token);
          unsubscribeUrl = url.toString();
        }
        const sendRes = await sendShoonayaEmail({
          to: profile!.email!,
          subject: variant.subject ?? "Shoonaya Weekly Dharma",
          shloka: "",
          meaning: "",
          title: variant.subject ?? "Shoonaya Weekly Dharma",
          body: trackLinksInText(variant.body, linkContext),
          ctaText: variant.cta_text ?? "Open Shoonaya",
          ctaUrl: withCampaignTracking(resolveCampaignCtaUrl(variant.cta_url), linkContext),
          unsubUrl: unsubscribeUrl,
          unsubType: campaign.campaign_type === "festival_reminder" ? "festivals" : "newsletter"
        }, { idempotencyKey: `marketing-dispatch:${row.id}` });

        if (sendRes.success && sendRes.id) {
          resolution = {
            status: "sent",
            provider: "resend",
            providerMessageId: sendRes.id,
          };
        } else if (sendRes.success) {
          resolution = {
            status: "outcome_unknown",
            provider: "resend",
            errorCode: "provider_success_missing_message_id",
          };
        } else {
          const errorCode = sanitizeErrorCode(sendRes.error);
          resolution = {
            status: sendRes.retryable || errorCode === "auth_failed" ? "retryable" : "failed",
            provider: "resend",
            errorCode,
          };
        }
      } catch (sendErr) {
        // Resend receives a stable idempotency key, so retrying an uncertain request
        // reuses the same provider operation instead of creating another message.
        resolution = {
          status: "retryable",
          provider: "resend",
          errorCode: sanitizeErrorCode(sendErr),
        };
      }
    } else {
      try {
        const sendRes = await whatsappProvider.sendText({
          to: profile!.whatsapp_number!,
          body: trackLinksInText(variant.body, linkContext, { bareDomain: true })
        });
        resolution = sendRes.messageId
          ? {
              status: "sent",
              provider: whatsappProvider.name,
              providerMessageId: sendRes.messageId,
            }
          : {
              status: "outcome_unknown",
              provider: whatsappProvider.name,
              errorCode: "provider_success_missing_message_id",
            };
      } catch (sendErr) {
        // This integration has no provider idempotency key. A timeout or network
        // failure may happen after acceptance, so automatic retry could duplicate it.
        resolution = {
          status: "outcome_unknown",
          provider: whatsappProvider.name,
          errorCode: sanitizeErrorCode(sendErr),
        };
      }
    }

    // Record the durable result before reporting it to the caller. If this compare-
    // and-set fails, the claimed row remains unresolved and no false success is shown.
    await resolveClaim(supabase, row, resolution);

    if (resolution.status === "sent") {
      result.sent++;
    } else {
      if (resolution.status === "retryable") result.retryable++;
      if (resolution.status === "outcome_unknown") result.outcomeUnknown++;
      if (resolution.status === "failed") result.failed++;
    }
    result.dispatches.push({
      recipient_user_id: row.recipient_user_id,
      channel: variant.channel,
      status: resolution.status,
      provider_message_id: resolution.providerMessageId ?? null,
      error_code: resolution.errorCode ?? null,
    });

  }

  return result;
}
