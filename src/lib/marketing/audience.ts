import { evaluateMarketingConsent } from "./consent";
import { resolveRecipientEmails } from "@/lib/server/recipient-emails";
import type { MarketingCampaign, MarketingChannel, RecipientProfile } from "./types";

const PAGE_SIZE = 500;

export interface AudienceScope {
  channel: MarketingChannel;
  campaignType: MarketingCampaign["campaign_type"];
  tradition?: string | null;
}

const CANDIDATE_COLUMNS =
  "id, full_name, tradition, marketing_consent, email_newsletter, email_festivals, whatsapp_opt_in, whatsapp_number, unsubscribe_token, is_banned";

/**
 * Applies the same STATIC, SQL-expressible narrowing evaluateMarketingConsent
 * (consent.ts) would apply -- tradition, is_banned, and the channel/campaign-type
 * appropriate consent column -- so the candidate set fetched here is cheap and never
 * wildly over-broad. This is a pre-filter, not the final decision: E.164 validity,
 * placeholder-email detection, and the live re-check immediately before a provider
 * call still happen per-recipient via evaluateMarketingConsent (dispatcher.ts), using
 * this exact same query shape so seeding, preview, and dispatch can never silently
 * diverge on who's in scope.
 */
function candidateQuery(supabase: any, scope: AudienceScope, afterId: string | null) {
  let query = supabase
    .from("profiles")
    .select(CANDIDATE_COLUMNS)
    .eq("is_banned", false)
    .order("id", { ascending: true })
    .limit(PAGE_SIZE);

  if (afterId) {
    query = query.gt("id", afterId);
  }
  if (scope.tradition) {
    query = query.in("tradition", [scope.tradition, "all"]);
  }

  if (scope.channel === "email") {
    if (scope.campaignType === "festival_reminder") {
      query = query.eq("email_festivals", true);
    } else {
      query = query.eq("marketing_consent", true).eq("email_newsletter", true);
    }
  } else {
    query = query.eq("marketing_consent", true).eq("whatsapp_opt_in", true).not("whatsapp_number", "is", null);
  }

  return query;
}

/**
 * Pages through every static-eligibility candidate for a channel/campaign scope,
 * keyset-paginated on profiles.id (never an offset cap) -- yields one page of full
 * candidate rows at a time.
 */
export async function* iterateAudienceCandidates(
  supabase: any,
  scope: AudienceScope
): AsyncGenerator<RecipientProfile[]> {
  let cursor: string | null = null;

  while (true) {
    const { data, error } = await candidateQuery(supabase, scope, cursor);
    if (error) {
      throw new Error(`Failed to page marketing audience candidates: ${error.message}`);
    }
    const rows = (data ?? []) as Array<RecipientProfile & { id: string }>;
    if (rows.length === 0) {
      return;
    }

    if (scope.channel === "email") {
      const emailByUserId = await resolveRecipientEmails(supabase, rows.map(r => r.id));
      yield rows.map(r => ({ ...r, email: emailByUserId[r.id] ?? null }));
    } else {
      yield rows;
    }

    cursor = rows[rows.length - 1].id;
    if (rows.length < PAGE_SIZE) {
      return;
    }
  }
}

/**
 * Seeds 'pending' marketing_dispatches rows for every static-eligibility candidate.
 * Idempotent -- an already-existing row for (campaign, variant, recipient, channel)
 * is left untouched (onConflict + ignoreDuplicates), so re-seeding a partially-drained
 * campaign never resets an already-claimed/sent/failed row back to pending.
 */
export async function seedMarketingDispatches(
  supabase: any,
  campaign: MarketingCampaign,
  variantId: string,
  channel: MarketingChannel
): Promise<{ seeded: number }> {
  let seeded = 0;

  for await (const page of iterateAudienceCandidates(supabase, {
    channel,
    campaignType: campaign.campaign_type,
    tradition: null
  })) {
    if (page.length === 0) continue;

    const rows = page.map(profile => ({
      campaign_id: campaign.id,
      variant_id: variantId,
      recipient_user_id: profile.id,
      channel,
      status: "pending" as const
    }));

    const { error } = await supabase
      .from("marketing_dispatches")
      .upsert(rows, { onConflict: "campaign_id,variant_id,recipient_user_id,channel", ignoreDuplicates: true });

    if (error) {
      throw new Error(`Failed to seed marketing dispatches: ${error.message}`);
    }
    seeded += rows.length;
  }

  return { seeded };
}

export interface AudiencePreview {
  total: number;
  eligible: number;
  suppressedByReason: Record<string, number>;
}

/**
 * Full, honest recipient-count preview: pages through the same candidate set seeding
 * would use and runs the exact same evaluateMarketingConsent per row dispatch will run
 * immediately before sending -- so the number an admin sees before confirming a live
 * send is not a separate, potentially-optimistic estimate.
 */
export async function previewMarketingAudience(
  supabase: any,
  campaign: MarketingCampaign,
  channel: MarketingChannel
): Promise<AudiencePreview> {
  const preview: AudiencePreview = { total: 0, eligible: 0, suppressedByReason: {} };

  for await (const page of iterateAudienceCandidates(supabase, {
    channel,
    campaignType: campaign.campaign_type,
    tradition: null
  })) {
    for (const profile of page) {
      preview.total++;
      const consent = evaluateMarketingConsent(profile, channel, campaign.campaign_type);
      if (consent.eligible) {
        preview.eligible++;
      } else {
        preview.suppressedByReason[consent.reasonCode] = (preview.suppressedByReason[consent.reasonCode] ?? 0) + 1;
      }
    }
  }

  return preview;
}
