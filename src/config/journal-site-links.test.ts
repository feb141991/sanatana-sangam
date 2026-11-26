import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getPublishableFestivalSlugs } from "@/lib/festival-data";
import { MAJOR_FESTIVAL_SLUGS_FOR_SEO, TOP_DIASPORA_CITIES } from "@/lib/seo/festival-seo-pages";
import { VRAT_DATABASE } from "@/lib/vrat-data";
import { findJournalEssay, getAllJournalEssays } from "./journal";
import { getEssaySlugsForFestival, getJournalSiteLinks, linkedEssaySlugs } from "./journal-site-links";

const sitemapSource = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");

function isPublicPage(href: string): boolean {
  const city = href.match(/^\/festivals\/([^/]+)\/([^/]+)$/);
  if (city) return MAJOR_FESTIVAL_SLUGS_FOR_SEO.includes(city[1]) && TOP_DIASPORA_CITIES.includes(city[2]);
  const vrat = href.match(/^\/vrat\/([^/]+)$/);
  if (vrat) return vrat[1] in VRAT_DATABASE;
  const festival = href.match(/^\/festival\/([^/]+)$/);
  if (festival) return getPublishableFestivalSlugs().includes(festival[1]);
  return sitemapSource.includes("`${BASE_URL}" + href + "`");
}

describe("journal links to the rest of the site", () => {
  it("links only from published essays", () => {
    for (const slug of linkedEssaySlugs()) {
      expect(findJournalEssay(slug), slug).toBeDefined();
    }
  });

  it("links only to pages the sitemap lists", () => {
    for (const slug of linkedEssaySlugs()) {
      const { festivalDates, guides } = getJournalSiteLinks(slug);
      const hrefs = [...festivalDates.flatMap((group) => group.links), ...guides].map((link) => link.href);
      expect(hrefs.length, slug).toBeGreaterThan(0);
      for (const href of hrefs) expect(isPublicPage(href), `${slug} -> ${href}`).toBe(true);
    }
  });

  it("rejects a page that does not exist", () => {
    expect(isPublicPage("/festivals/diwali/atlantis")).toBe(false);
    expect(isPublicPage("/vrat/no-such-vrat")).toBe(false);
    expect(isPublicPage("/festival/diwali")).toBe(false);
    expect(isPublicPage("/no-such-page")).toBe(false);
  });

  it("lets a festival city page find its essays", () => {
    expect(getEssaySlugsForFestival("diwali")).toEqual([
      "diwali-lakshmi-puja-sthira-lagna-and-dhanteras-astronomy",
    ]);
    expect(getEssaySlugsForFestival("holi")).toEqual([]);
  });
});

describe("links between essays", () => {
  const essays = getAllJournalEssays();

  it("lists three related essays that exist, never itself", () => {
    for (const essay of essays) {
      expect(essay.relatedSlugs, essay.slug).toHaveLength(3);
      expect(new Set(essay.relatedSlugs).size, essay.slug).toBe(3);
      for (const related of essay.relatedSlugs) {
        expect(related, essay.slug).not.toBe(essay.slug);
        expect(findJournalEssay(related), `${essay.slug} -> ${related}`).toBeDefined();
      }
    }
  });

  it("links to every essay from at least one other essay", () => {
    const linked = new Set(essays.flatMap((essay) => essay.relatedSlugs));
    expect(essays.filter((essay) => !linked.has(essay.slug)).map((essay) => essay.slug)).toEqual([]);
  });
});
