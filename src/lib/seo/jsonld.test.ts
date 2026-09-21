import { describe, it, expect } from "vitest";
import { OFFICIAL_SOCIAL_LINKS } from "@/config/official-links";

describe("AEO & SEO JSON-LD Configuration", () => {
  it("contains the verified live LinkedIn company profile", () => {
    expect(OFFICIAL_SOCIAL_LINKS.linkedin).toBe("https://www.linkedin.com/company/shoonaya");
  });

  it("contains valid HTTPS social links for sameAs knowledge graph", () => {
    expect(OFFICIAL_SOCIAL_LINKS.instagram).toMatch(/^https:\/\/www\.instagram\.com\//);
    expect(OFFICIAL_SOCIAL_LINKS.facebook).toMatch(/^https:\/\/www\.facebook\.com\//);
  });
});
