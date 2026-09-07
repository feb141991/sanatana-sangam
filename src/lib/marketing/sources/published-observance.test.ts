import { describe, it, expect } from "vitest";
import {
  filterEligibleMarketingObservances,
  buildObservanceSourceSnapshot,
  RULED_SLUGS,
  type ObservanceJoinedRow
} from "./published-observance";

describe("Published Observance Safe Source Ingestion", () => {
  it("approves valid, published, ruled observances (e.g. Diwali, Rama Navami)", () => {
    const validRow: ObservanceJoinedRow = {
      id: "occ-1",
      date: "2026-10-20",
      publication_status: "published",
      observance_definitions: {
        slug: "diwali",
        display_name: "Diwali",
        tradition: "hindu",
        description: "Festival of lights",
      },
    };

    const eligible = filterEligibleMarketingObservances([validRow]);
    expect(eligible).toHaveLength(1);
    expect(eligible[0].id).toBe("occ-1");

    const snapshot = buildObservanceSourceSnapshot(eligible[0]);
    expect(snapshot).toEqual({
      occurrence_id: "occ-1",
      slug: "diwali",
      display_name: "Diwali",
      date: "2026-10-20",
      tradition: "hindu",
      description: "Festival of lights",
      verified_source: "CANONICAL_RULES",
    });
  });

  it("rejects occurrences with publication_status !== published (e.g. draft, withheld_disputed)", () => {
    const draftRow: ObservanceJoinedRow = {
      id: "occ-2",
      date: "2026-10-20",
      publication_status: "draft",
      observance_definitions: {
        slug: "diwali",
        display_name: "Diwali",
      },
    };
    const disputedRow: ObservanceJoinedRow = {
      id: "occ-3",
      date: "2026-10-20",
      publication_status: "withheld_disputed",
      observance_definitions: {
        slug: "diwali",
        display_name: "Diwali",
      },
    };

    const eligible = filterEligibleMarketingObservances([draftRow, disputedRow]);
    expect(eligible).toHaveLength(0);
  });

  it("rejects unruled or manual-seed slugs lacking approved rules.json entry (e.g. das-lakshana-dharma)", () => {
    const unruledRow: ObservanceJoinedRow = {
      id: "occ-4",
      date: "2026-09-15",
      publication_status: "published",
      observance_definitions: {
        slug: "unruled-custom-festival-xyz",
        display_name: "Unruled Festival",
      },
    };

    const eligible = filterEligibleMarketingObservances([unruledRow]);
    expect(eligible).toHaveLength(0);
  });

  it("handles malformed or array-joined definitions safely without throwing", () => {
    const arrayJoinedRow: ObservanceJoinedRow = {
      id: "occ-5",
      date: "2026-10-20",
      publication_status: "published",
      observance_definitions: [
        {
          slug: "diwali",
          display_name: "Diwali",
        },
      ],
    };
    const nullDefRow: ObservanceJoinedRow = {
      id: "occ-6",
      date: "2026-10-20",
      publication_status: "published",
      observance_definitions: null,
    };

    const eligible = filterEligibleMarketingObservances([arrayJoinedRow, nullDefRow]);
    expect(eligible).toHaveLength(1);
    expect(eligible[0].id).toBe("occ-5");
  });
});
