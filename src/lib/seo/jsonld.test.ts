import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { OFFICIAL_SOCIAL_LINKS } from "@/config/official-links";

const landingHtml = readFileSync("public/landing.html", "utf8");
const jsonLdMatch = landingHtml.match(
  /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/,
);
if (!jsonLdMatch) throw new Error("Homepage JSON-LD block is missing");

const homepageSchema = JSON.parse(jsonLdMatch[1]) as {
  "@graph"?: Array<Record<string, unknown>>;
};
const softwareApplication = homepageSchema["@graph"]?.find(
  (node) => node["@type"] === "SoftwareApplication",
);

describe("AEO & SEO JSON-LD Configuration", () => {
  it("contains the verified live LinkedIn company profile", () => {
    expect(OFFICIAL_SOCIAL_LINKS.linkedin).toBe("https://www.linkedin.com/company/shoonaya");
  });

  it("contains valid HTTPS social links for sameAs knowledge graph", () => {
    expect(OFFICIAL_SOCIAL_LINKS.instagram).toMatch(/^https:\/\/www\.instagram\.com\//);
    expect(OFFICIAL_SOCIAL_LINKS.facebook).toMatch(/^https:\/\/www\.facebook\.com\//);
  });

  it("keeps Shoonaya distinct in the raw HTML homepage identity", () => {
    expect(landingHtml).toContain('<title>Shoonaya: Find your infinite.</title>');
    expect(landingHtml).toMatch(
      /<h1 id="splash-title">Shoonaya\.<em>Find your infinite\.<\/em><\/h1>/,
    );
    expect(softwareApplication?.name).toBe("Shoonaya");
    expect(softwareApplication?.description).toContain(
      "A daily spiritual sanctuary for sacred time, practice, and connection.",
    );
    expect(softwareApplication?.alternateName).toBeUndefined();
    expect(softwareApplication?.sameAs).toEqual([
      "https://apps.apple.com/app/shoonaya/id6793055966",
    ]);
  });
});
