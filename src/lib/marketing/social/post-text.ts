/**
 * The exact text published to a social platform: caption, then the tagged app link where the platform can
 * show one, then hashtags.
 *
 * The approved variant already carries a cta_url (it is part of the approved content hash), but the publishers
 * used to ignore it, so a post never linked anywhere. Facebook and LinkedIn captions can carry a clickable
 * link; Instagram captions cannot (the caption says "link in bio"), so Instagram gets no link appended.
 * Only Shoonaya's own links are ever appended or tagged.
 */
import {
  containsOwnLink,
  resolveCampaignCtaUrl,
  trackLinksInText,
  withCampaignTracking,
  type LinkContext
} from "../campaign-links";
import type { SocialPlatform } from "./types";

export function composeSocialText(input: {
  platform: SocialPlatform;
  caption: string;
  hashtags: string[];
  ctaUrl: string | null;
  /** The post's key, used as utm_campaign. */
  trackingCampaign?: string;
}): string {
  const ctx: LinkContext = { channel: input.platform, campaign: input.trackingCampaign ?? "social" };

  let text = trackLinksInText(input.caption, ctx);
  if (input.platform !== "instagram" && input.ctaUrl && !containsOwnLink(text)) {
    const link = withCampaignTracking(resolveCampaignCtaUrl(input.ctaUrl), ctx);
    if (containsOwnLink(link)) text = `${text}\n\n${link}`;
  }

  const tagLine =
    input.hashtags.length > 0 ? `\n\n${input.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}` : "";
  return `${text}${tagLine}`;
}
