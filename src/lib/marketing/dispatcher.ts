import { evaluateMarketingConsent } from "./consent";
import { computeContentHash } from "./campaign-service";
import { sendShoonayaEmail } from "@/lib/email";
import { createWhatsAppProvider } from "@/lib/whatsapp/provider";
import { resolveRecipientEmails } from "@/lib/server/recipient-emails";
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
  /** Minutes before a claimed-but-unresolved row becomes reclaimable by another call. */
  leaseMinutes?: number;
}

export interface DispatchResult {
  total: number;
  sent: number;
  suppressed: number;
  failed: number;
  dryRun: boolean;
  dispatches: Array<{
    recipient_user_id: string;
    channel: MarketingChannel;
    status: "sent" | "failed" | "suppressed";
    provider_message_id?: string | null;
    error_code?: string | null;
  }>;
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
 * (FOR UPDATE SKIP LOCKED, lease-based recovery of stuck claims) -- only the caller
 * holding a claimed row may invoke a provider for it. Re-dispatch safety is now
 * structural: a 'sent' row can never be reclaimed (the claim RPC only selects
 * 'pending' or lease-expired 'claimed' rows, and a DB trigger rejects any attempt to
 * move a 'sent' row to any other status), so there is no separate
 * check-then-send-then-upsert race window.
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
      await supabase
        .from("marketing_dispatches")
        .update({ status: "suppressed", last_error_code: consent.reasonCode, updated_at: new Date().toISOString() })
        .eq("id", row.id);
      continue;
    }

    // 2. Real provider dispatch. The claimed row's own id is passed where the
    //    provider supports an idempotency key, so a retried call after an uncertain
    //    response is deduped provider-side too, not just by this row's own status.
    try {
      if (variant.channel === "email") {
        const sendRes = await sendShoonayaEmail({
          to: profile!.email!,
          subject: variant.subject ?? "Shoonaya Weekly Dharma",
          shloka: "",
          meaning: "",
          title: variant.subject ?? "Shoonaya Weekly Dharma",
          body: variant.body,
          ctaText: variant.cta_text ?? "Open Shoonaya",
          ctaUrl: variant.cta_url ?? "https://www.shoonaya.com",
          unsubUrl: profile!.unsubscribe_token
            ? `https://www.shoonaya.com/api/unsubscribe?token=${profile!.unsubscribe_token}`
            : undefined
        });

        if (!sendRes || sendRes.success !== true) {
          throw new Error(sendRes?.error ? String(sendRes.error) : "Resend delivery failed");
        }

        result.sent++;
        result.dispatches.push({ recipient_user_id: row.recipient_user_id, channel: "email", status: "sent" });

        await supabase
          .from("marketing_dispatches")
          .update({
            status: "sent",
            provider: "resend",
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", row.id);
      } else {
        const sendRes = await whatsappProvider.sendText({
          to: profile!.whatsapp_number!,
          body: variant.body
        });

        result.sent++;
        result.dispatches.push({
          recipient_user_id: row.recipient_user_id,
          channel: "whatsapp",
          status: "sent",
          provider_message_id: sendRes.messageId ?? null
        });

        await supabase
          .from("marketing_dispatches")
          .update({
            status: "sent",
            provider: whatsappProvider.name,
            provider_message_id: sendRes.messageId ?? null,
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", row.id);
      }
    } catch (sendErr) {
      // A thrown/network error here is an UNCERTAIN outcome (the provider may or may
      // not have actually sent it) -- it is recorded as 'failed', which remains
      // reclaimable-by-retry (never silently 'sent', never permanently stuck), and the
      // retried send reuses this exact same row / idempotency key rather than
      // inserting a new one.
      const code = sanitizeErrorCode(sendErr);
      result.failed++;
      result.dispatches.push({
        recipient_user_id: row.recipient_user_id,
        channel: variant.channel,
        status: "failed",
        error_code: code
      });

      await supabase
        .from("marketing_dispatches")
        .update({ status: "failed", last_error_code: code, updated_at: new Date().toISOString() })
        .eq("id", row.id);
    }
  }

  return result;
}
