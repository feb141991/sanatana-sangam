/**
 * Generates a diaspora-focused marketing DRAFT: a pillar, a region and optionally a tradition and a verified
 * occasion become a campaign with one variant per channel, in draft, for a person to review and approve.
 *
 * Differences from generateMarketingDraft, on purpose:
 *   - every channel is drafted and checked IN MEMORY first (copy-check.ts); a campaign is only created if all of
 *     them pass, so a refused draft leaves nothing half-made behind;
 *   - a failed check gets one retry with the broken rules fed back to the writer, then the whole request stops
 *     with the reasons;
 *   - it never uses the "newsletter" campaign type, whose writer instructions ask the model to produce scripture
 *     verses with translations, which the content rules forbid.
 *
 * Nothing here approves or sends anything: approval and dispatch stay human, consent-checked actions.
 */
import { resolveStoreUrls } from "@/lib/app-store-links";
import { draftChannelCopy } from "../ai-generator";
import { cancelCampaign, createCampaign, saveVariant } from "../campaign-service";
import { buildObservanceSourceSnapshot, getPublishableOccurrenceById } from "../sources/published-observance";
import type { MarketingCampaign, MarketingCampaignVariant, MarketingChannel, MarketingSourceSnapshot } from "../types";
import { buildDiasporaStrategyPrompt, DIASPORA_TRADITIONS, type DiasporaTradition } from "./brief";
import { checkVariantCopy, type Violation } from "./copy-check";
import { pillarById } from "./pillars";
import { regionById } from "./regions";

export const DIASPORA_CHANNELS: readonly MarketingChannel[] = ["email", "whatsapp"];
const MAX_ATTEMPTS = 2;

export interface GenerateDiasporaInput {
  pillarId: string;
  regionId: string;
  tradition: string | null;
  channels: string[];
  occurrenceId: string | null;
  createdBy: string;
}

export type GenerateDiasporaFailure =
  | "invalid_pillar"
  | "invalid_region"
  | "invalid_tradition"
  | "invalid_channels"
  | "occasion_required"
  | "occasion_not_publishable"
  | "generation_failed"
  | "empty_content"
  | "content_check_failed"
  | "campaign_creation_failed"
  | "variant_save_failed";

export type GenerateDiasporaResult =
  | {
      ok: true;
      campaign: MarketingCampaign;
      variants: MarketingCampaignVariant[];
      /** How many tries each channel needed (1 means the first draft passed). */
      attempts: Record<string, number>;
    }
  | { ok: false; reason: GenerateDiasporaFailure; detail?: string; violations?: Array<Violation & { channel: string }> };

export interface DiasporaDeps {
  now?: () => Date;
  random?: () => string;
  env?: Record<string, string | undefined>;
}

function fail(reason: GenerateDiasporaFailure, detail?: string, violations?: Array<Violation & { channel: string }>): GenerateDiasporaResult {
  return { ok: false, reason, ...(detail ? { detail } : {}), ...(violations ? { violations } : {}) };
}

export function diasporaCampaignKey(pillarId: string, regionId: string, now: Date, suffix: string): string {
  const day = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `diaspora-${pillarId.replace(/_/g, "-")}-${regionId.replace(/_/g, "-")}-${day}-${suffix}`.slice(0, 120);
}

interface Drafted {
  channel: MarketingChannel;
  subject: string | null;
  body: string;
  cta_text: string | null;
  cta_url: string | null;
  modelUsed: string;
  provider: string;
  attempts: number;
}

export async function generateDiasporaDraft(
  supabase: any,
  input: GenerateDiasporaInput,
  deps: DiasporaDeps = {}
): Promise<GenerateDiasporaResult> {
  const pillar = pillarById(input.pillarId);
  if (!pillar) return fail("invalid_pillar");
  const region = regionById(input.regionId);
  if (!region) return fail("invalid_region");
  const tradition = input.tradition === null || input.tradition === "" ? null : input.tradition;
  if (tradition !== null && !(DIASPORA_TRADITIONS as readonly string[]).includes(tradition)) return fail("invalid_tradition");

  const channels = [...new Set(input.channels)];
  if (channels.length === 0 || channels.some((c) => !(DIASPORA_CHANNELS as readonly string[]).includes(c))) {
    return fail("invalid_channels", `Channels must be among: ${DIASPORA_CHANNELS.join(", ")}`);
  }

  if (pillar.needsOccasion && !input.occurrenceId) return fail("occasion_required", "This pillar is about a specific festival: choose a verified occasion.");

  // The occasion is checked before the model is ever called: only a currently publishable, verified occurrence may
  // ground a campaign, exactly as in generateMarketingDraft.
  let sourceSnapshot: MarketingSourceSnapshot | null = null;
  let sourceCitations: unknown[] = [];
  if (input.occurrenceId) {
    const occurrence = await getPublishableOccurrenceById(supabase, input.occurrenceId);
    if (!occurrence) return fail("occasion_not_publishable");
    sourceSnapshot = buildObservanceSourceSnapshot(occurrence);
    sourceCitations = [{ source: sourceSnapshot.verified_source ?? "CANONICAL_RULES", occurrence_id: sourceSnapshot.occurrence_id, slug: sourceSnapshot.slug }];
  }

  const androidPublic = resolveStoreUrls(deps.env ?? process.env).android !== null;
  const occasionDate = sourceSnapshot?.date ?? null;
  const campaignType = sourceSnapshot ? "festival_reminder" : "announcement";

  const drafted: Drafted[] = [];
  const brokeAfterRetry: Array<Violation & { channel: string }> = [];

  for (const channel of channels as MarketingChannel[]) {
    let corrections: string[] = [];
    let last: Drafted | null = null;
    let violations: Violation[] = [];

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let draft;
      try {
        draft = await draftChannelCopy({
          channel,
          campaignType,
          sourceSnapshot,
          strategyPrompt: buildDiasporaStrategyPrompt({ pillar, region, tradition: tradition as DiasporaTradition | null, corrections }),
          targetTradition: tradition
        });
      } catch (error) {
        return fail("generation_failed", `${channel}: ${error instanceof Error ? error.message : "unknown error"}`);
      }

      const bodyOk = Boolean(draft.body?.trim());
      const subjectOk = channel !== "email" || Boolean(draft.subject?.trim());
      if (!bodyOk || !subjectOk) return fail("empty_content", channel);

      last = {
        channel,
        subject: draft.subject ?? null,
        body: draft.body,
        cta_text: draft.cta_text ?? null,
        cta_url: draft.cta_url ?? null,
        modelUsed: draft.modelUsed,
        provider: draft.provider,
        attempts: attempt
      };
      violations = checkVariantCopy({ subject: last.subject, body: last.body, cta_text: last.cta_text }, { occasionDate, androidPublic });
      if (violations.length === 0) break;
      corrections = [...new Set(violations.map((v) => `${v.message} (you wrote: "${v.excerpt}")`))];
    }

    if (violations.length > 0) {
      brokeAfterRetry.push(...violations.map((v) => ({ ...v, channel })));
    } else if (last) {
      drafted.push(last);
    }
  }

  // Nothing is saved unless every channel passed.
  if (brokeAfterRetry.length > 0) {
    return fail("content_check_failed", "The draft broke the content rules twice, so nothing was saved.", brokeAfterRetry);
  }

  const now = (deps.now ?? (() => new Date()))();
  const suffix = (deps.random ?? (() => Math.random().toString(16).slice(2, 6)))();
  let campaign: MarketingCampaign;
  try {
    campaign = await createCampaign(supabase, {
      campaign_key: diasporaCampaignKey(pillar.id, region.id, now, suffix),
      title: `Diaspora · ${pillar.title} · ${region.label}`,
      campaign_type: campaignType,
      source_type: sourceSnapshot ? "published_observance" : "manual",
      source_occurrence_id: input.occurrenceId,
      target_tradition: tradition,
      target_sampradaya: null,
      created_by: input.createdBy
    });
  } catch (error) {
    return fail("campaign_creation_failed", error instanceof Error ? error.message : undefined);
  }

  const variants: MarketingCampaignVariant[] = [];
  for (const item of drafted) {
    try {
      variants.push(
        await saveVariant(supabase, {
          campaign_id: campaign.id,
          channel: item.channel,
          subject: item.subject,
          body: item.body,
          cta_text: item.cta_text,
          cta_url: item.cta_url,
          source_snapshot: sourceSnapshot ?? {},
          source_citations: sourceCitations,
          generation_provenance: {
            model_used: item.modelUsed,
            provider: item.provider,
            generated_at: now.toISOString(),
            diaspora: { pillar: pillar.id, region: region.id, tradition, attempts: item.attempts }
          },
          generation_metadata: {
            source_type: sourceSnapshot ? "published_observance" : "manual",
            diaspora_pillar: pillar.id,
            diaspora_region: region.id,
            content_check: "passed"
          }
        })
      );
    } catch (error) {
      // Do not leave a campaign with some channels written and others missing.
      await cancelCampaign(supabase, campaign.id).catch(() => undefined);
      return fail("variant_save_failed", `${item.channel}: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  return { ok: true, campaign, variants, attempts: Object.fromEntries(drafted.map((d) => [d.channel, d.attempts])) };
}
