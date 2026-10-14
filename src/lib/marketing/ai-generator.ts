import { generateWithProvider } from "@/lib/ai/providers/inference";
import { createCampaign, saveVariant } from "./campaign-service";
import { getPublishableOccurrenceById, buildObservanceSourceSnapshot } from "./sources/published-observance";
import type {
  MarketingCampaign,
  MarketingCampaignType,
  MarketingCampaignVariant,
  MarketingChannel,
  MarketingSourceSnapshot,
  MarketingSourceType
} from "./types";

export interface GenerateMarketingDraftInput {
  campaignKey: string;
  title: string;
  campaignType: MarketingCampaignType;
  channels: MarketingChannel[];
  createdBy: string;
  /** When set, the campaign is grounded on this occurrence -- generation fails
   * closed (produces nothing) unless it is currently publishable. */
  sourceOccurrenceId?: string | null;
  targetTradition?: string | null;
  targetSampradaya?: string | null;
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
  campaignType?: MarketingCampaignType;
  sourceSnapshot?: MarketingSourceSnapshot | null;
  strategyPrompt?: string | null;
  targetTradition?: string | null;
  targetSampradaya?: string | null;
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
${input.targetTradition ? `\nTarget Audience Tradition: ${input.targetTradition}${input.targetSampradaya ? ` (Subcategory/Path: ${input.targetSampradaya})` : ""}. Speak with authentic resonance for practitioners of this path without misrepresenting or excluding them.\n` : ""}${input.strategyPrompt ? `\nStrategic Creative Angle / Emotional Guidance:\n${input.strategyPrompt}\n` : ""}
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

  let channelInstructions: string;
  if (input.channel === "email") {
    if (input.campaignType === "newsletter") {
      channelInstructions = `Produce a JSON object with exactly these keys: {
  "subject": "under 65 characters, poetic, spiritually resonant weekly digest title",
  "body": "Formatted email newsletter in markdown with clear, elegant section headings (### and ####), 450-650 words, structured with:
1. Sacred Reflection • The Week Concluded: A meaningful reflection on how the events of the past week concluded, what spiritual seeds were planted, and how we carry that energy forward.
2. Sacred Horizons • The Coming Days Ahead: Detailed preview of upcoming holy observances, explaining their practical and spiritual significance for the modern seeker.
3. Four Living Streams of Dharma • Wisdom from All Traditions: Dedicated, substantive paragraphs for EACH of the four traditions (Sanatan, Jain, Sikh, Buddhist) with authentic scripture shlokas/verses, transliteration, and English translation.
4. Inner Anchor: Practical encouragement for daily japa, meditation, and quiet reflection with Shoonaya.",
  "cta_text": "2-4 words, e.g. Open Shoonaya Sanctuary",
  "cta_url": "https://www.shoonaya.com"
}. Keep the tone deeply reverent, warm, unifying, and authentic to all traditions.`;
    } else if (input.campaignType === "daily_content") {
      channelInstructions = `Produce a JSON object with exactly these keys: {
  "subject": "under 60 characters, inspiring daily reflection title for today's practice",
  "body": "Daily spiritual reflection (180-250 words) in clean markdown:
- Sacred Contemplation of the Day: An uplifting insight connecting morning wakefulness to inner stillness.
- Timeless Shloka / Wisdom Quote: Authentic verse with translation.
- Daily Sadhana Practice: A simple 5-minute action (e.g. 108 japa repetitions, mindful breath, evening gratitude).",
  "cta_text": "Open Today's Sanctuary",
  "cta_url": "https://www.shoonaya.com"
}. Warm, grounded, calming Shoonaya brand voice.`;
    } else {
      channelInstructions = `Produce a JSON object with exactly these keys: {"subject": "under 60 characters, compelling", "body": "100-180 words, structured into 2-3 short, emotionally resonant paragraphs", "cta_text": "2-4 words, action-oriented", "cta_url": "a relative or https://www.shoonaya.com path"}. Warm, inviting Shoonaya brand voice.`;
    }
  } else if (input.channel === "whatsapp") {
    if (input.campaignType === "newsletter") {
      channelInstructions = `Produce a JSON object with exactly this key: {"body": "under 500 characters, crisp, emotive WhatsApp broadcast with bold headers and emojis covering: (1) Concluded grace, (2) Coming festival alerts, (3) Wisdom from dharmic streams, and (4) Link to open Shoonaya"}. Warm, inviting Shoonaya brand voice. No subject or CTA fields.`;
    } else if (input.campaignType === "daily_content") {
      channelInstructions = `Produce a JSON object with exactly this key: {"body": "under 320 characters, morning WhatsApp wisdom message:
*Daily Dharma • Shoonaya* 🪔
A crisp 2-sentence morning reflection, a short sacred shloka quote, and a reminder to anchor in stillness today. Open Shoonaya: shoonaya.com"}. Warm, emotive, and WhatsApp-ready. No subject or CTA fields.`;
    } else {
      channelInstructions = `Produce a JSON object with exactly this key: {"body": "under 300 characters, crisp, emotive, and WhatsApp-ready"}. Warm, inviting Shoonaya brand voice. No subject or CTA fields.`;
    }
  } else if (input.channel === "instagram") {
    channelInstructions = `Produce a JSON object with exactly this key: {
  "body": "Instagram caption formatted with clean paragraph breaks:
1. Hook line: An evocative first sentence that stops the scroll.
2. Contemplation: 2-3 short, poetic paragraphs (80-140 words total) exploring sacred time, inner peace, and dharmic mindfulness.
3. Call to Action: Gentle invitation to practice with Shoonaya (link in bio).
4. Curated Hashtags: 8-12 relevant hashtags on a new line (e.g. #Shoonaya #SanatanDharma #Dharma #DailyWisdom #InnerStillness #Meditation #Japa #SpiritualJourney #Mindfulness)."
}. Visually evocative, respectful, authentic Shoonaya brand voice. No subject or CTA fields.`;
  } else if (input.channel === "twitter") {
    channelInstructions = `Produce a JSON object with exactly this key: {
  "body": "Twitter/X post strictly under 270 characters total: A punchy, spiritually grounding thought, memorable shloka takeaway, or mindfulness insight with 1-2 tasteful emojis and #Shoonaya #Dharma. Must fit in one tweet (under 280 chars)."
}. Clean, sharp, profound. No subject or CTA fields.`;
  } else if (input.channel === "linkedin") {
    channelInstructions = `Produce a JSON object with exactly this key: {
  "body": "LinkedIn reflection (120-180 words): Exploring how timeless dharmic principles (such as samatvam/equanimity, nishkama karma, and mindful stillness) apply to modern leadership, professional balance, and mental clarity. Includes a thought-provoking opening, 2 short paragraphs, a reflective question for leaders, and #MindfulLeadership #Shoonaya #Dharma."
}. Sophisticated, respectful, professional tone. No subject or CTA fields.`;
  } else {
    channelInstructions = `Produce a JSON object with exactly this key: {"body": "under 250 words, warm, inspiring spiritual marketing copy"}. No subject or CTA fields.`;
  }

  const result = await generateWithProvider(
    {
      system:
        "You are a Shoonaya marketing copywriter. The approved brand expression is: ‘Shoonaya: Find your infinite. A daily spiritual sanctuary for sacred time, practice, and connection.’ Speak to busy people who want to notice sacred time, understand observances, and make room for daily practice. Use calm, clear, warm, spiritually grounded language. Shoonaya is rooted in Sanatan Dharma and includes distinct experiences for Sikh, Jain, and Buddhist paths; never imply these traditions are interchangeable. Do not overstate product availability, calendar accuracy, geographic coverage, or outcomes. Never fabricate or alter scripture, mantra syllables, ritual claims, or calendar dates.",
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
      target_tradition: input.targetTradition ?? null,
      target_sampradaya: input.targetSampradaya ?? null,
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
        campaignType: input.campaignType,
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
