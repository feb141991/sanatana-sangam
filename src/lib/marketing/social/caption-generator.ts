/**
 * Per-platform caption generation. Sarvam-only inference (AGENTS.md section
 * 11 -- no other provider may be wired in without an explicit, current
 * founder request naming it). Mirrors src/lib/marketing/ai-generator.ts's
 * grounding-block convention: source_snapshot fields are fixed facts the
 * model must reproduce verbatim, never regenerate or embellish.
 */
import { generateWithProvider } from "@/lib/ai/providers/inference";
import { isGenerationPaused } from "./reservation";
import type { SocialPlatform, SocialPostObjective, SocialPostSourceSnapshot, SocialContentType } from "./types";

export class GenerationPausedError extends Error {
  constructor() {
    super("Caption generation is paused (social_publishing_global_pause.generation_paused)");
    this.name = "GenerationPausedError";
  }
}

export interface DraftSocialCaptionInput {
  platform: SocialPlatform;
  themeType: SocialContentType;
  sourceSnapshot: SocialPostSourceSnapshot;
  objective: SocialPostObjective;
  targetTradition?: string | null;
}

export interface SocialCaptionDraft {
  caption: string;
  hashtags: string[];
  ctaUrl: string;
  modelUsed: string;
  provider: string;
}

interface RawCaptionDraft {
  caption: string;
  hashtags: string[];
  cta_url: string;
}

function extractJsonObject(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return a JSON object");
  }
  return raw.slice(start, end + 1);
}

function buildGroundingBlock(input: DraftSocialCaptionInput): string {
  if (input.themeType === "festival") {
    return `You are writing about this SPECIFIC, ALREADY-VERIFIED occurrence. Treat every field below as a fixed fact you MUST NOT alter, contradict, or add to -- no additional dates, scripture verses, mantras, or claims beyond what is given here:
Festival: ${input.sourceSnapshot.display_name ?? "unknown"}
Date: ${input.sourceSnapshot.date ?? "unknown"}
Tradition: ${input.sourceSnapshot.tradition ?? "unknown"}
Description: ${input.sourceSnapshot.description ?? ""}
Verified source: ${input.sourceSnapshot.verified_source ?? ""}
${input.targetTradition ? `\nTarget Audience Tradition: ${input.targetTradition}. Speak with authentic resonance for practitioners of this path without misrepresenting or excluding them.\n` : ""}
You may write ONLY the surrounding social caption prose -- never regenerate, translate, or paraphrase scripture, mantra syllables, or the festival's date/name itself; reproduce those verbatim from the fields above if you reference them at all.`;
  }

  return `You are writing general spiritual/app-discovery social content grounded EXCLUSIVELY in this admin-supplied, pre-approved factual/spiritual backing. Treat it as a fixed fact you must not contradict or extend beyond:
Theme: ${input.sourceSnapshot.theme_title ?? "unknown"}
Grounding material (the only source of any factual/spiritual claim you may make): ${input.sourceSnapshot.grounding_material ?? ""}
Do not invent any scripture quotation, mantra, festival date, deity name, or historical claim beyond what is stated in the grounding material above.`;
}

function platformInstructions(platform: SocialPlatform, objective: SocialPostObjective): string {
  const objectiveLine =
    objective === "activation"
      ? "The goal is to drive the reader to open the Shoonaya app right now."
      : objective === "app_discovery"
      ? "The goal is to introduce a reader unfamiliar with Shoonaya to what it offers."
      : objective === "learning"
      ? "The goal is to teach something true and grounded, not to sell."
      : "The goal is warm, resonant awareness -- no hard sell.";

  if (platform === "linkedin") {
    return `Produce a JSON object with exactly these keys: {"caption": "120-220 words, professional but warm tone suitable for a company page, no more than 2 short paragraphs", "hashtags": ["3-5 relevant hashtags without the # symbol"], "cta_url": "https://www.shoonaya.com"}. ${objectiveLine} Avoid emoji-heavy or overly casual language.`;
  }
  if (platform === "instagram") {
    return `Produce a JSON object with exactly these keys: {"caption": "80-150 words, warm, poetic, emotionally resonant, tasteful emoji use", "hashtags": ["8-15 relevant hashtags without the # symbol, mixing broad and specific"], "cta_url": "https://www.shoonaya.com"}. ${objectiveLine}`;
  }
  return `Produce a JSON object with exactly these keys: {"caption": "60-120 words, warm, inviting Shoonaya brand voice", "hashtags": ["3-6 relevant hashtags without the # symbol"], "cta_url": "https://www.shoonaya.com"}. ${objectiveLine}`;
}

/**
 * Checks the LIVE generation_paused flag immediately before calling the
 * model -- not once earlier in the pipeline -- so a pause flipped on after
 * a post was reserved still stops this specific call from running (the
 * exact timing correction from the approved plan's section 2, point 1).
 */
export async function draftSocialCaption(
  supabase: any,
  input: DraftSocialCaptionInput
): Promise<SocialCaptionDraft> {
  if (await isGenerationPaused(supabase)) {
    throw new GenerationPausedError();
  }

  const result = await generateWithProvider(
    {
      system:
        "You are a social media copywriter for Shoonaya, the global dharmic companion app spanning Hindu, Sikh, Buddhist, and Jain traditions. You must never fabricate or alter scripture, mantra syllables, ritual claims, or calendar dates.",
      user: `${buildGroundingBlock(input)}\n\n${platformInstructions(input.platform, input.objective)}`,
      reasoningEffort: "none"
    },
    { responseFormat: "json", maxOutputTokens: 1200 }
  );

  const parsed = JSON.parse(extractJsonObject(result.text)) as RawCaptionDraft;
  if (!parsed.caption?.trim()) {
    throw new Error("Caption generation produced empty content");
  }

  return {
    caption: parsed.caption,
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.filter(h => typeof h === "string" && h.trim()) : [],
    ctaUrl: parsed.cta_url?.trim() || "https://www.shoonaya.com",
    modelUsed: result.modelUsed,
    provider: result.provider
  };
}
