/**
 * Where a phone should be sent to get (or open) the Shoonaya app, and the campaign attribution each store
 * understands. Used by the /get redirect so one link in an email, WhatsApp message or social post works on
 * every device.
 *
 * Android has no public listing yet: until NATIVE_APP_STORE_URL_ANDROID holds a valid Play URL, Android
 * visitors go to the beta page instead of a store link that would not exist.
 */
import { parseStoreUrl } from "@/lib/native-app-version-policy";

export const SITE_ORIGIN = "https://www.shoonaya.com";
export const IOS_APP_STORE_URL = "https://apps.apple.com/app/shoonaya/id6793055966";
export const ANDROID_BETA_PATH = "/beta/android";

export type MobilePlatform = "ios" | "android" | "other";

export interface TrackingParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

const TRACKING_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/** Lower-case, URL-safe, bounded: tracking values come from the query string, so they are never trusted as typed. */
export function sanitizeTrackingValue(value: string | null | undefined, maxLength = 64): string | undefined {
  if (!value) return undefined;
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
  return cleaned || undefined;
}

export function readTrackingParams(searchParams: URLSearchParams): TrackingParams {
  const out: TrackingParams = {};
  for (const key of TRACKING_KEYS) {
    const value = sanitizeTrackingValue(searchParams.get(key));
    if (value) out[key] = value;
  }
  return out;
}

/** Search-engine and link-preview bots are sent to the site, never into a store. */
const BOT_PATTERN = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|embedly|quora link|pinterest|bingpreview/i;

export function detectMobilePlatform(userAgent: string | null | undefined): MobilePlatform {
  if (!userAgent || BOT_PATTERN.test(userAgent)) return "other";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "other";
}

export function resolveStoreUrls(env: Record<string, string | undefined>): { ios: string; android: string | null } {
  return {
    ios: parseStoreUrl(env.NATIVE_APP_STORE_URL_IOS, "ios") ?? IOS_APP_STORE_URL,
    android: parseStoreUrl(env.NATIVE_APP_STORE_URL_ANDROID, "android")
  };
}

/**
 * App Store campaign link: `ct` names the campaign; `pt` is the provider token from App Store Connect
 * (APP_STORE_PROVIDER_TOKEN) and is what makes the campaign show up in App Store Connect analytics.
 */
export function withAppStoreCampaign(storeUrl: string, tracking: TrackingParams, providerToken?: string): string {
  const url = new URL(storeUrl);
  const campaign = tracking.utm_campaign?.slice(0, 40);
  if (campaign) {
    url.searchParams.set("ct", campaign);
    url.searchParams.set("mt", "8");
    const token = sanitizeTrackingValue(providerToken, 32);
    if (token) url.searchParams.set("pt", token);
  }
  return url.toString();
}

/** Google Play install referrer: the UTM values travel into Play Console's acquisition reports. */
export function withPlayReferrer(storeUrl: string, tracking: TrackingParams): string {
  const url = new URL(storeUrl);
  const parts = TRACKING_KEYS.filter((key) => tracking[key]).map((key) => `${key}=${tracking[key]}`);
  if (parts.length > 0) url.searchParams.set("referrer", parts.join("&"));
  return url.toString();
}

export function withTrackingParams(rawUrl: string, tracking: TrackingParams): string {
  const url = new URL(rawUrl);
  for (const key of TRACKING_KEYS) {
    const value = tracking[key];
    if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
  }
  return url.toString();
}

/** Pure decision used by the /get route: where this visitor goes. */
export function resolveGetDestination(input: {
  userAgent: string | null | undefined;
  tracking: TrackingParams;
  env: Record<string, string | undefined>;
  origin?: string;
}): string {
  const origin = input.origin ?? SITE_ORIGIN;
  const platform = detectMobilePlatform(input.userAgent);
  const stores = resolveStoreUrls(input.env);

  if (platform === "ios") {
    return withAppStoreCampaign(stores.ios, input.tracking, input.env.APP_STORE_PROVIDER_TOKEN);
  }
  if (platform === "android") {
    return stores.android
      ? withPlayReferrer(stores.android, input.tracking)
      : withTrackingParams(`${origin}${ANDROID_BETA_PATH}`, input.tracking);
  }
  return withTrackingParams(`${origin}/`, input.tracking);
}
