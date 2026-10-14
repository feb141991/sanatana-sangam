import { describe, it, expect } from "vitest";
import {
  containsOwnLink,
  resolveCampaignCtaUrl,
  SMART_APP_LINK,
  trackLinksInText,
  withCampaignTracking,
  type LinkContext
} from "./campaign-links";

const email: LinkContext = { channel: "email", campaign: "diwali-reminder-2026", content: "en" };
const params = (url: string) => Object.fromEntries(new URL(url).searchParams);

describe("resolveCampaignCtaUrl", () => {
  it.each([null, undefined, "", "   "])("a missing link (%j) becomes the smart app link", (raw) => {
    expect(resolveCampaignCtaUrl(raw)).toBe(SMART_APP_LINK);
  });

  it.each(["https://www.shoonaya.com", "https://www.shoonaya.com/", "https://shoonaya.com", "http://shoonaya.com/", "/"])(
    "a bare homepage link (%s) becomes the smart app link",
    (raw) => {
      expect(resolveCampaignCtaUrl(raw)).toBe(SMART_APP_LINK);
    }
  );

  it("keeps a specific page: it already opens the app for people who have it", () => {
    expect(resolveCampaignCtaUrl("https://www.shoonaya.com/festival/diwali")).toBe("https://www.shoonaya.com/festival/diwali");
    expect(resolveCampaignCtaUrl("/panchang")).toBe("/panchang");
  });

  it("keeps a homepage link that carries its own non-UTM meaning", () => {
    expect(resolveCampaignCtaUrl("https://www.shoonaya.com/?ref=abc")).toBe("https://www.shoonaya.com/?ref=abc");
  });

  it("never rewrites a third-party link", () => {
    expect(resolveCampaignCtaUrl("https://example.com/")).toBe("https://example.com/");
  });
});

describe("withCampaignTracking", () => {
  it("adds source, medium, campaign and content for email", () => {
    const out = withCampaignTracking(SMART_APP_LINK, email);
    expect(out.startsWith("https://www.shoonaya.com/get?")).toBe(true);
    expect(params(out)).toEqual({
      utm_source: "shoonaya",
      utm_medium: "email",
      utm_campaign: "diwali-reminder-2026",
      utm_content: "en"
    });
  });

  it.each([
    ["whatsapp", "whatsapp", "messaging"],
    ["instagram", "instagram", "social"],
    ["facebook", "facebook", "social"],
    ["linkedin", "linkedin", "social"]
  ] as const)("%s uses source=%s medium=%s", (channel, source, medium) => {
    expect(params(withCampaignTracking(SMART_APP_LINK, { channel, campaign: "c" }))).toMatchObject({
      utm_source: source,
      utm_medium: medium
    });
  });

  it("never overwrites a UTM value the link already has", () => {
    const out = withCampaignTracking("https://www.shoonaya.com/get?utm_source=partner&utm_campaign=custom", email);
    expect(params(out)).toMatchObject({ utm_source: "partner", utm_campaign: "custom", utm_medium: "email" });
  });

  it("is idempotent: tagging twice changes nothing the second time", () => {
    const once = withCampaignTracking(SMART_APP_LINK, email);
    expect(withCampaignTracking(once, email)).toBe(once);
  });

  it("keeps the rest of the link: path, other query values and the fragment", () => {
    const out = withCampaignTracking("https://www.shoonaya.com/festival/diwali?lang=hi#story", email);
    const url = new URL(out);
    expect(url.pathname).toBe("/festival/diwali");
    expect(url.searchParams.get("lang")).toBe("hi");
    expect(url.hash).toBe("#story");
    expect(url.searchParams.get("utm_campaign")).toBe("diwali-reminder-2026");
  });

  it("turns a relative link into an absolute Shoonaya link", () => {
    expect(withCampaignTracking("/panchang", email).startsWith("https://www.shoonaya.com/panchang?")).toBe(true);
  });

  it("sanitises the campaign key so a odd key cannot break the link", () => {
    const out = withCampaignTracking(SMART_APP_LINK, { channel: "email", campaign: "Diwali Reminder & 2026!!" });
    expect(params(out).utm_campaign).toBe("diwali-reminder-2026");
  });

  it("leaves third-party links alone", () => {
    expect(withCampaignTracking("https://example.com/page", email)).toBe("https://example.com/page");
    expect(withCampaignTracking("https://shoonaya.com.evil.example/x", email)).toBe("https://shoonaya.com.evil.example/x");
  });

  it("never touches API links such as unsubscribe", () => {
    const unsub = "https://www.shoonaya.com/api/unsubscribe?token=abc";
    expect(withCampaignTracking(unsub, email)).toBe(unsub);
  });

  it("returns something that is not a link unchanged", () => {
    expect(withCampaignTracking("not a url", email)).toBe("not a url");
    expect(withCampaignTracking("javascript:alert(1)", email)).toBe("javascript:alert(1)");
  });
});

describe("trackLinksInText", () => {
  it("tags a Shoonaya link inside a sentence and keeps the punctuation after it", () => {
    const out = trackLinksInText("Open https://www.shoonaya.com/panchang. See you there!", email);
    expect(out).toMatch(/^Open https:\/\/www\.shoonaya\.com\/panchang\?[^ ]+\. See you there!$/);
    expect(out).toContain("utm_campaign=diwali-reminder-2026");
  });

  it("turns a bare homepage link in the text into the smart link", () => {
    expect(trackLinksInText("Join https://www.shoonaya.com today", email)).toContain("https://www.shoonaya.com/get?");
  });

  it("handles a markdown link without eating the closing bracket", () => {
    const out = trackLinksInText("[Open](https://www.shoonaya.com/vrat/ekadashi)", email);
    expect(out).toMatch(/^\[Open\]\(https:\/\/www\.shoonaya\.com\/vrat\/ekadashi\?[^)]+\)$/);
  });

  it("leaves other people's links, and Shoonaya's API links, untouched", () => {
    const text = "Read https://example.com/a and https://www.shoonaya.com/api/unsubscribe?token=t";
    expect(trackLinksInText(text, email)).toBe(text);
  });

  describe("bare 'shoonaya.com' mentions (WhatsApp copy)", () => {
    const wa: LinkContext = { channel: "whatsapp", campaign: "weekly-w42" };

    it("are left alone unless asked", () => {
      expect(trackLinksInText("Open Shoonaya: shoonaya.com", wa)).toBe("Open Shoonaya: shoonaya.com");
    });

    it("become the tagged smart link when asked", () => {
      const out = trackLinksInText("Open Shoonaya: shoonaya.com", wa, { bareDomain: true });
      expect(out).toMatch(/^Open Shoonaya: https:\/\/www\.shoonaya\.com\/get\?/);
      expect(out).toContain("utm_medium=messaging");
    });

    it("never touch an email address, a longer domain or a deeper path", () => {
      for (const text of ["write to support@shoonaya.com", "visit shoonaya.com.au", "see shoonaya.com/panchang", "x.shoonaya.com"]) {
        expect(trackLinksInText(text, wa, { bareDomain: true })).toBe(text);
      }
    });

    it("tag a mention at the end of a sentence without eating the full stop", () => {
      const out = trackLinksInText("Get it at shoonaya.com.", wa, { bareDomain: true });
      expect(out).toMatch(/get\?[^ ]+\.$/);
    });
  });
});

describe("containsOwnLink", () => {
  it("is true only for Shoonaya links", () => {
    expect(containsOwnLink("see https://www.shoonaya.com/x.")).toBe(true);
    expect(containsOwnLink("see https://example.com/x")).toBe(false);
    expect(containsOwnLink("no links here")).toBe(false);
  });
});
