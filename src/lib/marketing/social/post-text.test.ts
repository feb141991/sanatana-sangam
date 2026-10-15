import { describe, it, expect } from "vitest";
import { composeSocialText } from "./post-text";

const base = { caption: "A quiet morning thought.", hashtags: ["Shoonaya", "#Dharma"], ctaUrl: "https://www.shoonaya.com", trackingCampaign: "social-general-2026-10-16" };

describe("composeSocialText", () => {
  it("Facebook: caption, then the tagged smart app link, then hashtags", () => {
    const out = composeSocialText({ platform: "facebook", ...base });
    const [caption, link, tags] = out.split("\n\n");
    expect(caption).toBe("A quiet morning thought.");
    const url = new URL(link);
    expect(url.origin + url.pathname).toBe("https://www.shoonaya.com/get");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      utm_source: "facebook",
      utm_medium: "social",
      utm_campaign: "social-general-2026-10-16"
    });
    expect(tags).toBe("#Shoonaya #Dharma");
  });

  it("LinkedIn gets the link too, with its own source", () => {
    const out = composeSocialText({ platform: "linkedin", ...base });
    expect(out).toContain("utm_source=linkedin");
  });

  it("Instagram gets no link appended (a caption link is not clickable) but keeps its hashtags", () => {
    const out = composeSocialText({ platform: "instagram", ...base });
    expect(out).toBe("A quiet morning thought.\n\n#Shoonaya #Dharma");
  });

  it("does not add a second link when the caption already has a Shoonaya link, and tags that one", () => {
    const out = composeSocialText({ platform: "facebook", ...base, caption: "Read more at https://www.shoonaya.com/panchang today." });
    expect(out.match(/shoonaya\.com/g)).toHaveLength(1);
    expect(out).toContain("utm_campaign=social-general-2026-10-16");
  });

  it("adds no link when the post has none approved", () => {
    expect(composeSocialText({ platform: "facebook", ...base, ctaUrl: null })).toBe("A quiet morning thought.\n\n#Shoonaya #Dharma");
  });

  it("never appends a third-party link", () => {
    expect(composeSocialText({ platform: "facebook", ...base, ctaUrl: "https://example.com/x" })).not.toContain("example.com");
  });

  it("works with no hashtags", () => {
    const out = composeSocialText({ platform: "facebook", ...base, hashtags: [] });
    expect(out.endsWith("&utm_campaign=social-general-2026-10-16")).toBe(true);
  });
});
