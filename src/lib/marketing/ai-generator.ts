import { generateWithProvider } from "@/lib/ai/providers/inference";
import { createCampaign, saveVariant } from "./campaign-service";
import { getPublishableOccurrenceById, buildObservanceSourceSnapshot } from "./sources/published-observance";
import type {
  MarketingCampaign,
  MarketingCampaignVariant,
  MarketingChannel,
  MarketingSourceSnapshot,
  MarketingSourceType
} from "./types";

export interface GenerateMarketingDraftInput {
  campaignKey: string;
  title: string;
  campaignType: "newsletter" | "festival_reminder" | "announcement";
  channels: MarketingChannel[];
  createdBy: string;
  /** When set, the campaign is grounded on this occurrence -- generation fails
   * closed (produces nothing) unless it is currently publishable. */
  sourceOccurrenceId?: string | null;
  /** Optional creative brief, theme, psychological hook, or emotional instructions. */
  strategyPrompt?: string | null;
}

export type GenerateMarketingDraftResult =
  | { ok: true; campaign: MarketingCampaign; variants: MarketingCampaignVariant[] }
  | { ok: false; reason: string };

function extractJsonObject(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return a JSON object");
  }
  return raw.slice(start, end + 1);
}

interface ChannelDraft {
  subject?: string;
  body: string;
  cta_text?: string;
  cta_url?: string;
}

/**
 * Drafts surrounding marketing prose for one channel. When `sourceSnapshot` is
 * populated (a published_observance campaign), the model is instructed to treat every
 * source field as a fixed fact it must not alter or add to, and to write only the
 * inviting prose/subject line around it -- never regenerate the festival name, date,
 * or any scripture/mantra text itself. When there is no source (a manual campaign),
 * the model is instructed to stay non-specific rather than invent any scripture,
 * mantra, festival date, or historical claim.
 */
export interface DraftChannelCopyInput {
  channel: MarketingChannel;
  sourceSnapshot?: MarketingSourceSnapshot | null;
  strategyPrompt?: string | null;
}

export async function draftChannelCopy(
  input: DraftChannelCopyInput
): Promise<ChannelDraft & { modelUsed: string; provider: string }> {
  const groundingBlock = input.sourceSnapshot
    ? `You are writing about this SPECIFIC, ALREADY-VERIFIED occurrence. Treat every field below as a fixed fact you MUST NOT alter, contradict, or add to -- no additional dates, scripture verses, mantras, or claims beyond what is given here:
Festival: ${input.sourceSnapshot.display_name ?? "unknown"}
Date: ${input.sourceSnapshot.date ?? "unknown"}
Tradition: ${input.sourceSnapshot.tradition ?? "unknown"}
Description: ${input.sourceSnapshot.description ?? ""}
Verified source: ${input.sourceSnapshot.verified_source ?? ""}
${input.strategyPrompt ? `\nStrategic Creative Angle / Emotional Guidance:\n${input.strategyPrompt}\n` : ""}
You may write ONLY the surrounding marketing prose (subject line, an inviting lead-in, a call to action) -- never regenerate, translate, or paraphrase scripture, mantra syllables, or the festival's date/name itself; reproduce those verbatim from the fields above if you reference them at all.`
    : input.strategyPrompt
    ? `You are crafting marketing copy for Shoonaya grounded in this strategic creative brief and psychological angle:
"""
${input.strategyPrompt}
"""
Guidelines:
- Tap into the universal emotional realities of diaspora, belonging, spiritual anchoring, and the busy modern seeker.
- Tone: deeply respectful, warm, poetic yet urgent, elevating dharma beyond mere rituals into a living, daily sanctuary.
- Never invent fabricated scripture citations, mantras, or fake festival dates. Speak directly to human experience, sadhana, stillness, and spiritual homecoming.`
    : `Write general, warm, non-specific marketing copy for a dharmic-practice app. Do not invent any specific scripture quotation, mantra, festival date, deity name, or historical claim -- keep it to an invitation to practice, reflect, or explore the app, nothing that could be factually wrong.`;

  const channelInstructions =
    input.channel === "email"
      ? `Produce a JSON object with exactly these keys: {"subject": "under 60 characters, compelling", "body": "100-160 words, structured into 2-3 short, emotionally resonant paragraphs", "cta_text": "2-4 words, action-oriented", "cta_url": "a relative or https://www.shoonaya.com path"}. Warm, inviting Shoonaya brand voice.`
      : `Produce a JSON object with exactly this key: {"body": "under 300 characters, crisp, emotive, and WhatsApp-ready"}. Warm, inviting Shoonaya brand voice. No subject or CTA fields.`;

  const result = await generateWithProvider(
    {
      system:
        "You are a master marketing strategist and copywriter for Shoonaya, the global dharmic companion app spanning Hindu, Sikh, Buddhist, and Jain traditions. You craft poignant, spiritually elevated copy that bridges ancestral roots and modern daily life. You must never fabricate or alter scripture, mantra syllables, ritual claims, or calendar dates.",
      user: `${groundingBlock}\n\n${channelInstructions}`,
      reasoningEffort: "none"
    },
    { responseFormat: "json", maxOutputTokens: 2500 }
  );

  const parsed = JSON.parse(extractJsonObject(result.text)) as ChannelDraft;
  return { ...parsed, modelUsed: result.modelUsed, provider: result.provider };
}

/**
 * Generates an AI-drafted marketing campaign: creates it in 'draft' status and adds
 * one variant per requested channel. Never sets status past 'draft' -- approval and
 * dispatch remain exclusively human, admin-only actions (approveCampaign/
 * dispatchMarketingBatch, gated by requireAdminAccess at the route layer), which this
 * function simply never calls.
 *
 * Fails closed at every stage: an occurrence that isn't currently publishable, a
 * channel draft that comes back empty, or a generation error for any one channel all
 * produce a structured {ok:false, reason} and create/persist nothing further -- never
 * a campaign left half-drafted with fabricated or empty content.
 */
export async function generateMarketingDraft(
  supabase: any,
  input: GenerateMarketingDraftInput
): Promise<GenerateMarketingDraftResult> {
  if (input.channels.length === 0) {
    return { ok: false, reason: "no_channels_requested" };
  }

  const sourceType: MarketingSourceType = input.sourceOccurrenceId ? "published_observance" : "manual";
  let sourceSnapshot: MarketingSourceSnapshot | null = null;
  let sourceCitations: unknown[] = [];

  if (sourceType === "published_observance") {
    const occurrence = await getPublishableOccurrenceById(supabase, input.sourceOccurrenceId!);
    if (!occurrence) {
      return { ok: false, reason: "source_occurrence_not_publishable" };
    }
    sourceSnapshot = buildObservanceSourceSnapshot(occurrence);
    sourceCitations = [
      {
        source: sourceSnapshot.verified_source ?? "CANONICAL_RULES",
        occurrence_id: sourceSnapshot.occurrence_id,
        slug: sourceSnapshot.slug
      }
    ];
    // Fail closed before ever calling the model: a published_observance campaign
    // with no citation to attach is exactly the case that must produce nothing.
    if (sourceCitations.length === 0) {
      return { ok: false, reason: "no_source_citation_available" };
    }
  }

  let campaign: MarketingCampaign;
  try {
    campaign = await createCampaign(supabase, {
      campaign_key: input.campaignKey,
      title: input.title,
      campaign_type: input.campaignType,
      source_type: sourceType,
      source_occurrence_id: input.sourceOccurrenceId ?? null,
      created_by: input.createdBy
    });
  } catch (err: any) {
    return { ok: false, reason: `campaign_creation_failed: ${err.message}` };
  }

  const variants: MarketingCampaignVariant[] = [];

  for (const channel of input.channels) {
    let draft: ChannelDraft & { modelUsed: string; provider: string };
    try {
      draft = await draftChannelCopy({
        channel,
        sourceSnapshot,
        strategyPrompt: input.strategyPrompt
      });
    } catch (err: any) {
      return { ok: false, reason: `generation_failed_${channel}: ${err.message}` };
    }

    const bodyOk = Boolean(draft.body?.trim());
    const subjectOk = channel !== "email" || Boolean(draft.subject?.trim());
    if (!bodyOk || !subjectOk) {
      return { ok: false, reason: `generation_produced_empty_content_${channel}` };
    }

    try {
      const variant = await saveVariant(supabase, {
        campaign_id: campaign.id,
        channel,
        subject: draft.subject ?? null,
        body: draft.body,
        cta_text: draft.cta_text ?? null,
        cta_url: draft.cta_url ?? null,
        source_snapshot: sourceSnapshot ?? {},
        source_citations: sourceCitations,
        generation_provenance: {
          model_used: draft.modelUsed,
          provider: draft.provider,
          generated_at: new Date().toISOString(),
          ...(input.strategyPrompt ? { strategy_prompt_used: true } : {})
        },
        generation_metadata: {
          source_type: sourceType,
          ...(input.strategyPrompt ? { strategy_prompt: input.strategyPrompt } : {})
        }
      });
      variants.push(variant);
    } catch (err: any) {
      return { ok: false, reason: `variant_save_failed_${channel}: ${err.message}` };
    }
  }

  return { ok: true, campaign, variants };
}
