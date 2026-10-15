/**
 * The caption that goes with a morning card, built only from the verified pieces of the verse.
 *
 * It is deliberately not written by a language model. A model asked to caption a verse tends to add a paraphrase
 * or a claim of its own, and on scripture that is exactly what the content rules forbid. This caption is the verse,
 * the translation when the corpus has a sourced one, the citation, and a tracked link, so there is nothing in it
 * that did not come from the corpus. The admin can still edit it before approving.
 *
 * The original text is repeated in the caption on purpose: screen readers cannot read text inside an image, and
 * search engines index the caption.
 */
import { SMART_APP_LINK, withCampaignTracking } from "../../campaign-links";
import { formatVerseLines } from "./verse-format";
import type { MorningTradition, MorningVerse } from "./types";

export interface MorningCaption {
  caption: string;
  hashtags: string[];
}

const HASHTAGS: Record<MorningTradition, string[]> = {
  hindu: ["SanatanDharma", "BhagavadGita", "DailyWisdom", "Shoonaya"],
  sikh: ["Gurbani", "Sikhi", "JapjiSahib", "Shoonaya"],
  buddhist: ["BuddhaDhamma", "Dhammapada", "DailyWisdom", "Shoonaya"],
  jain: ["JainDharma", "Ahimsa", "DailyWisdom", "Shoonaya"]
};

export function morningCampaignKey(date: string, tradition: MorningTradition): string {
  return `morning-${date}-${tradition}`;
}

export function buildMorningCaption(verse: MorningVerse, date: string): MorningCaption {
  const link = withCampaignTracking(SMART_APP_LINK, {
    channel: "social",
    campaign: morningCampaignKey(date, verse.tradition)
  });

  const source = verse.attribution && verse.script === "gurmukhi" ? `${verse.citation} · ${verse.attribution}` : verse.citation;
  const parts: string[] = ["Good morning from Shoonaya.", formatVerseLines(verse.original)];

  if (verse.translation && verse.translationCredit) {
    parts.push(`“${verse.translation}”\n— ${verse.citation} (${verse.translationCredit})`);
  } else {
    parts.push(`— ${source}`);
  }
  parts.push(`Find your infinite: ${link}`);

  return { caption: parts.join("\n\n"), hashtags: HASHTAGS[verse.tradition] };
}

/** The caption and hashtags as one block, the way they are pasted into a post. */
export function captionWithHashtags(caption: string, hashtags: readonly string[]): string {
  return hashtags.length > 0 ? `${caption}\n\n${hashtags.map((tag) => `#${tag}`).join(" ")}` : caption;
}
