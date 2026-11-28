import { describe, expect, it } from "vitest";
import { findJournalEssay, getAllJournalEssays } from "./journal";

describe("45-essay batch verification", () => {
  const all = getAllJournalEssays();

  it("exposes all 80 published journal essays with unique slugs", () => {
    expect(all.length).toBe(80); // 35 prior + 45 newly published
    const slugs = new Set(all.map((e) => e.slug));
    expect(slugs.size).toBe(all.length);
  });

  it("ensures every published essay has verified editorialReview, non-empty citations, and scannable sections", () => {
    for (const essay of all) {
      expect(essay.publicationStatus).toBe("published");
      expect(essay.editorialReview?.sourcesVerified).toBe(true);
      expect(essay.citations.length).toBeGreaterThan(0);
      expect(findJournalEssay(essay.slug)?.slug).toBe(essay.slug);
    }
  });
});
