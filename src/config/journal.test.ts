import { describe, expect, it } from "vitest";
import {
  findJournalEssay,
  getAllJournalEssays,
  getFeaturedJournalEssay,
  getRelatedEssays,
} from "./journal";

describe("journal publication gate", () => {
  it("exposes verified, published essays through public readers", () => {
    const essays = getAllJournalEssays();
    expect(essays.length).toBe(10);

    const mandirEssay = findJournalEssay("architecture-of-silence-ancient-mandirs");
    expect(mandirEssay).toBeDefined();
    expect(mandirEssay?.publicationStatus).toBe("published");
    expect(mandirEssay?.editorialReview?.sourcesVerified).toBe(true);

    const tithiEssay = findJournalEssay("the-global-tithi-discrepancy-astronomy-and-timezones");
    expect(tithiEssay).toBeDefined();
    expect(tithiEssay?.publicationStatus).toBe("published");
    expect(tithiEssay?.editorialReview?.sourcesVerified).toBe(true);

    const featured = getFeaturedJournalEssay();
    expect(featured).toBeDefined();
    expect(featured?.slug).toBe(essays[0].slug);

    const related = getRelatedEssays("architecture-of-silence-ancient-mandirs");
    expect(related.length).toBeGreaterThan(0);
  });
});
