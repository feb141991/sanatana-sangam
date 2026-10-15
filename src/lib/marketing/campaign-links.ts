/**
 * UTM tagging for every link a marketing message carries, and the smart app link they point at.
 *
 * Tracking is applied at SEND time, not stored in the approved copy: the admin approves the clean link, the
 * recipient gets the tagged one, and approvals are not invalidated by tagging. Only Shoonaya's own links are
 * touched (never a third-party URL), `/api/` links such as unsubscribe are never touched, and a UTM value that
 * is already on a link is never overwritten.
 */
import { SITE_ORIGIN, sanitizeTrackingValue } from "@/lib/app-store-links";

/** "social" is for copy written before anyone knows which platform it will be posted to (the morning cards). */
export type TrackingChannel = "email" | "whatsapp" | "instagram" | "facebook" | "linkedin" | "twitter" | "social";

/** The smart link: opens the right store on a phone, the site on a desktop. See src/app/get/route.ts. */
export const SMART_APP_LINK = `${SITE_ORIGIN}/get`;

const SOURCE_AND_MEDIUM: Record<TrackingChannel, { source: string; medium: string }> = {
  email: { source: "shoonaya", medium: "email" },
  whatsapp: { source: "whatsapp", medium: "messaging" },
  instagram: { source: "instagram", medium: "social" },
  facebook: { source: "facebook", medium: "social" },
  linkedin: { source: "linkedin", medium: "social" },
  twitter: { source: "twitter", medium: "social" },
  social: { source: "shoonaya", medium: "social" }
};

export interface LinkContext {
  channel: TrackingChannel;
  /** Campaign key or social post key: becomes utm_campaign. */
  campaign: string;
  /** Optional variant label, e.g. the locale: becomes utm_content. */
  content?: string;
}

const OWN_HOSTS = new Set(["www.shoonaya.com", "shoonaya.com"]);

function parseOwnUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw.startsWith("/") ? `${SITE_ORIGIN}${raw}` : raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  return OWN_HOSTS.has(url.hostname.toLowerCase()) ? url : null;
}

function isBareHomepage(url: URL): boolean {
  return url.pathname === "/" && !url.hash && ![...url.searchParams.keys()].some((key) => !key.startsWith("utm_"));
}

/**
 * A missing link or a bare homepage link becomes the smart app link; anything more specific is kept, because
 * a link to /festival/diwali already opens the app for people who have it and the site for people who do not.
 */
export function resolveCampaignCtaUrl(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return SMART_APP_LINK;
  const own = parseOwnUrl(raw.trim());
  if (own && isBareHomepage(own)) return SMART_APP_LINK;
  return raw.trim();
}

export function withCampaignTracking(rawUrl: string, ctx: LinkContext): string {
  const url = parseOwnUrl(rawUrl);
  if (!url || url.pathname.startsWith("/api/")) return rawUrl;

  const { source, medium } = SOURCE_AND_MEDIUM[ctx.channel];
  const values: Record<string, string | undefined> = {
    utm_source: source,
    utm_medium: medium,
    utm_campaign: sanitizeTrackingValue(ctx.campaign),
    utm_content: sanitizeTrackingValue(ctx.content)
  };
  for (const [key, value] of Object.entries(values)) {
    if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
  }
  return url.toString();
}

const URL_IN_TEXT = /https?:\/\/[^\s<>()[\]"']+/g;
const TRAILING_PUNCTUATION = /[.,;:!?]+$/;
// A standalone "shoonaya.com" mention (not part of an email address, a longer domain or a path).
const BARE_DOMAIN = /(?<![\w@./:-])(?:www\.)?shoonaya\.com(?![\w@/-]|\.\w)/gi;

/**
 * Tags every Shoonaya link inside free text. `bareDomain` also turns a plain "shoonaya.com" mention into the
 * tagged smart link, which is how WhatsApp copy usually refers to the app.
 */
export function trackLinksInText(text: string, ctx: LinkContext, options: { bareDomain?: boolean } = {}): string {
  const tagged = text.replace(URL_IN_TEXT, (match) => {
    const trailing = match.match(TRAILING_PUNCTUATION)?.[0] ?? "";
    const link = trailing ? match.slice(0, -trailing.length) : match;
    if (!parseOwnUrl(link)) return match;
    return `${withCampaignTracking(resolveCampaignCtaUrl(link), ctx)}${trailing}`;
  });
  if (!options.bareDomain) return tagged;
  return tagged.replace(BARE_DOMAIN, () => withCampaignTracking(SMART_APP_LINK, ctx));
}

export function containsOwnLink(text: string): boolean {
  return (text.match(URL_IN_TEXT) ?? []).some((candidate) => parseOwnUrl(candidate.replace(TRAILING_PUNCTUATION, "")));
}
