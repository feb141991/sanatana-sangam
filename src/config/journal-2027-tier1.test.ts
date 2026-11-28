import { describe, expect, it } from "vitest";
import { findJournalEssay, getAllJournalEssays } from "./journal";
import { ekadashi2027Essay } from "./journal-ekadashi-2027";
import { purnimaAmavasya2027Essay } from "./journal-purnima-amavasya-2027";
import { diwali2027Essay } from "./journal-diwali-2027";
import { sikhCalendar2027Essay } from "./journal-sikh-calendar-2027";

describe("2027 Tier-1 SEO journal guides", () => {
  const drafts = [ekadashi2027Essay, purnimaAmavasya2027Essay, diwali2027Essay, sikhCalendar2027Essay];

  it("publishes all four 2027 guides with verified editorial review", () => {
    for (const essay of drafts) {
      expect(essay.publicationStatus).toBe("published");
      expect(essay.editorialReview?.sourcesVerified).toBe(true);
      expect(findJournalEssay(essay.slug)?.slug).toBe(essay.slug);
      expect(getAllJournalEssays().some((e) => e.slug === essay.slug)).toBe(true);
    }
  });

  it("uses structured highlights and tables with non-empty citations", () => {
    for (const essay of drafts) {
      expect(essay.sections.some((s) => Boolean(s.highlights?.length))).toBe(true);
      expect(essay.sections.some((s) => Boolean(s.table?.rows.length))).toBe(true);
      expect(essay.citations.length).toBeGreaterThan(0);
    }
    expect(ekadashi2027Essay.sections[1]?.table?.rows.length).toBe(26); // 25 legacy-ujjain + Vijaya Purnimanta
    expect(purnimaAmavasya2027Essay.sections[1]?.table?.rows.length).toBe(23);
    expect(diwali2027Essay.sections[0]?.table?.rows.length).toBe(5);
    expect(sikhCalendar2027Essay.sections[0]?.table?.rows.length).toBe(9);
  });
});
