import { describe, it, expect } from "vitest";
import {
  detectMobilePlatform,
  IOS_APP_STORE_URL,
  readTrackingParams,
  resolveGetDestination,
  resolveStoreUrls,
  sanitizeTrackingValue,
  withAppStoreCampaign,
  withPlayReferrer
} from "./app-store-links";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36";
const DESKTOP = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
const GOOGLEBOT_MOBILE = "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const WHATSAPP_PREVIEW = "WhatsApp/2.23.20.0 A";
const PLAY_URL = "https://play.google.com/store/apps/details?id=com.shoonaya.app";
const tracking = { utm_source: "shoonaya", utm_medium: "email", utm_campaign: "diwali-2026" };

describe("sanitizeTrackingValue / readTrackingParams", () => {
  it("lower-cases, replaces unsafe characters and bounds the length", () => {
    expect(sanitizeTrackingValue("Diwali Reminder & 2026!!")).toBe("diwali-reminder-2026");
    expect(sanitizeTrackingValue("a".repeat(200))).toHaveLength(64);
    expect(sanitizeTrackingValue("///")).toBeUndefined();
    expect(sanitizeTrackingValue("")).toBeUndefined();
  });

  it("reads only the five UTM keys and sanitises each", () => {
    const out = readTrackingParams(new URLSearchParams("utm_source=Email&utm_campaign=x%20y&evil=1&utm_medium="));
    expect(out).toEqual({ utm_source: "email", utm_campaign: "x-y" });
  });
});

describe("detectMobilePlatform", () => {
  it("recognises phones and tablets", () => {
    expect(detectMobilePlatform(IPHONE)).toBe("ios");
    expect(detectMobilePlatform(ANDROID)).toBe("android");
    expect(detectMobilePlatform(DESKTOP)).toBe("other");
  });

  it("never treats a crawler or a link-preview bot as a phone, even one that says Android", () => {
    expect(detectMobilePlatform(GOOGLEBOT_MOBILE)).toBe("other");
    expect(detectMobilePlatform(WHATSAPP_PREVIEW)).toBe("other");
    expect(detectMobilePlatform("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")).toBe("other");
  });

  it("treats a missing user agent as not a phone", () => {
    expect(detectMobilePlatform(null)).toBe("other");
    expect(detectMobilePlatform(undefined)).toBe("other");
  });
});

describe("resolveStoreUrls", () => {
  it("uses the App Store listing by default and has no Android store link until one is configured", () => {
    expect(resolveStoreUrls({})).toEqual({ ios: IOS_APP_STORE_URL, android: null });
  });

  it("accepts a valid Play URL from config", () => {
    expect(resolveStoreUrls({ NATIVE_APP_STORE_URL_ANDROID: PLAY_URL }).android).toBe(PLAY_URL);
  });

  it("rejects a store URL for some other app or host", () => {
    expect(resolveStoreUrls({ NATIVE_APP_STORE_URL_ANDROID: "https://play.google.com/store/apps/details?id=evil.app" }).android).toBeNull();
    expect(resolveStoreUrls({ NATIVE_APP_STORE_URL_IOS: "https://evil.example/app/shoonaya/id6793055966" }).ios).toBe(IOS_APP_STORE_URL);
  });
});

describe("store attribution", () => {
  it("App Store link carries the campaign name; the provider token only when configured", () => {
    const withoutToken = new URL(withAppStoreCampaign(IOS_APP_STORE_URL, tracking));
    expect(withoutToken.searchParams.get("ct")).toBe("diwali-2026");
    expect(withoutToken.searchParams.has("pt")).toBe(false);
    expect(new URL(withAppStoreCampaign(IOS_APP_STORE_URL, tracking, "123456")).searchParams.get("pt")).toBe("123456");
  });

  it("App Store link is unchanged when there is no campaign", () => {
    expect(withAppStoreCampaign(IOS_APP_STORE_URL, {})).toBe(IOS_APP_STORE_URL);
  });

  it("Play link carries the UTM values as the install referrer", () => {
    const referrer = new URL(withPlayReferrer(PLAY_URL, tracking)).searchParams.get("referrer");
    expect(referrer).toBe("utm_source=shoonaya&utm_medium=email&utm_campaign=diwali-2026");
  });
});

describe("resolveGetDestination", () => {
  const env = {};
  it("iPhone goes to the App Store with the campaign", () => {
    const dest = new URL(resolveGetDestination({ userAgent: IPHONE, tracking, env }));
    expect(dest.hostname).toBe("apps.apple.com");
    expect(dest.searchParams.get("ct")).toBe("diwali-2026");
  });

  it("Android goes to the beta page, with the UTM kept, while there is no Play listing", () => {
    const dest = new URL(resolveGetDestination({ userAgent: ANDROID, tracking, env }));
    expect(dest.origin + dest.pathname).toBe("https://www.shoonaya.com/beta/android");
    expect(dest.searchParams.get("utm_campaign")).toBe("diwali-2026");
  });

  it("Android goes to Google Play once a Play URL is configured", () => {
    const dest = new URL(resolveGetDestination({ userAgent: ANDROID, tracking, env: { NATIVE_APP_STORE_URL_ANDROID: PLAY_URL } }));
    expect(dest.hostname).toBe("play.google.com");
    expect(dest.searchParams.get("id")).toBe("com.shoonaya.app");
    expect(dest.searchParams.get("referrer")).toContain("utm_campaign=diwali-2026");
  });

  it("desktop, crawlers and link previews go to the website, not a store", () => {
    for (const userAgent of [DESKTOP, GOOGLEBOT_MOBILE, WHATSAPP_PREVIEW, null]) {
      const dest = new URL(resolveGetDestination({ userAgent, tracking, env }));
      expect(dest.origin + dest.pathname).toBe("https://www.shoonaya.com/");
    }
  });

  it("the destination can never be steered by the request: only sanitised tracking values pass through", () => {
    const hostile = readTrackingParams(new URLSearchParams("utm_source=https://evil.example&utm_campaign=//evil.example/x&next=https://evil.example"));
    for (const userAgent of [IPHONE, ANDROID, DESKTOP]) {
      const dest = new URL(resolveGetDestination({ userAgent, tracking: hostile, env }));
      expect(["apps.apple.com", "www.shoonaya.com"]).toContain(dest.hostname);
      expect(dest.toString()).not.toContain("evil.example/x");
    }
  });
});
