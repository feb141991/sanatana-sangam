import { describe, it, expect, vi } from "vitest";
import {
  createCampaign,
  saveVariant,
  submitForReview,
  approveCampaign,
  cancelCampaign,
  computeContentHash
} from "./campaign-service";

const baseManifest = {
  body: "Body text here",
  channel: "email" as const,
  locale: "en"
};

describe("Marketing Campaign Workflow & Approval Service", () => {
  it("computes deterministic content hashes", () => {
    const hash1 = computeContentHash({ ...baseManifest, subject: "Weekly Dharma" });
    const hash2 = computeContentHash({ ...baseManifest, subject: "Weekly Dharma" });
    const hash3 = computeContentHash({ ...baseManifest, subject: "Different Subject" });

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });

  it("changes the hash when source_citations differ, not just subject/body", () => {
    const hash1 = computeContentHash({ ...baseManifest, subject: "S", source_citations: [] });
    const hash2 = computeContentHash({ ...baseManifest, subject: "S", source_citations: ["Rigveda 3.62.10"] });
    expect(hash1).not.toBe(hash2);
  });

  it("creates a new campaign in draft status", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "c-1",
                campaign_key: "weekly-2026-w38",
                title: "Week 38 Newsletter",
                status: "draft",
                created_by: "admin",
              },
              error: null,
            }),
          }),
        }),
      }),
    };

    const campaign = await createCampaign(mockSupabase as any, {
      campaign_key: "weekly-2026-w38",
      title: "Week 38 Newsletter",
      created_by: "admin",
    });

    expect(campaign.status).toBe("draft");
    expect(campaign.campaign_key).toBe("weekly-2026-w38");
  });

  it("invalidates approved status and resets to draft when an approved variant is edited", async () => {
    const updateSpy = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: {}, error: null }) });
    const upsertSpy = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "var-1", body: "Updated copy" },
          error: null,
        }),
      }),
    });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "marketing_campaigns") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "c-1", status: "approved" },
                  error: null,
                }),
              }),
            }),
            update: updateSpy,
          };
        }
        if (table === "marketing_campaign_variants") {
          return {
            upsert: upsertSpy,
          };
        }
        throw new Error("unexpected table");
      }),
    };

    await saveVariant(mockSupabase as any, {
      campaign_id: "c-1",
      channel: "email",
      body: "Updated copy",
    });

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "draft",
        approved_by: null,
        approved_at: null,
      })
    );
  });

  it("rejects saving a variant on a dispatching/completed/cancelled campaign", async () => {
    const upsertSpy = vi.fn();
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "marketing_campaigns") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "c-1", status: "dispatching" }, error: null }),
              }),
            }),
          };
        }
        if (table === "marketing_campaign_variants") {
          return { upsert: upsertSpy };
        }
        throw new Error("unexpected table");
      }),
    };

    await expect(
      saveVariant(mockSupabase as any, { campaign_id: "c-1", channel: "email", body: "New copy" })
    ).rejects.toThrow(/dispatching/);

    expect(upsertSpy).not.toHaveBeenCalled();
  });
});

describe("approveCampaign lifecycle guards", () => {
  function mockCampaignFetch(campaign: Record<string, unknown>) {
    return vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: campaign, error: null }),
      }),
    });
  }

  function mockVariantsFetch(variants: Record<string, unknown>[]) {
    return vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: variants, error: null }),
    });
  }

  const validVariant = {
    id: "var-1",
    channel: "email",
    locale: "en",
    subject: "Weekly Dharma",
    body: "Body",
    cta_text: null,
    cta_url: null,
    source_snapshot: {},
    source_citations: [],
    content_version: 1,
  };

  it("rejects approving a draft campaign directly (must go through in_review)", async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "marketing_campaigns") {
          return {
            select: mockCampaignFetch({ id: "c-1", status: "draft", source_type: "manual" }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "marketing_campaign_variants") {
          return { select: mockVariantsFetch([validVariant]) };
        }
        throw new Error("unexpected table");
      }),
    };

    await expect(approveCampaign(mockSupabase as any, "c-1", "admin")).rejects.toThrow(
      /in_review|draft cannot be approved directly/
    );
  });

  it("rejects approving a campaign with no variants", async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "marketing_campaigns") {
          return { select: mockCampaignFetch({ id: "c-1", status: "in_review", source_type: "manual" }) };
        }
        if (table === "marketing_campaign_variants") {
          return { select: mockVariantsFetch([]) };
        }
        throw new Error("unexpected table");
      }),
    };

    await expect(approveCampaign(mockSupabase as any, "c-1", "admin")).rejects.toThrow(/no variants/);
  });

  it("rejects approving when an email variant has an empty subject", async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "marketing_campaigns") {
          return { select: mockCampaignFetch({ id: "c-1", status: "in_review", source_type: "manual" }) };
        }
        if (table === "marketing_campaign_variants") {
          return { select: mockVariantsFetch([{ ...validVariant, subject: "" }]) };
        }
        throw new Error("unexpected table");
      }),
    };

    await expect(approveCampaign(mockSupabase as any, "c-1", "admin")).rejects.toThrow(/non-empty subject/);
  });

  it("rejects approving a published_observance campaign whose variant has no source_citations", async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "marketing_campaigns") {
          return {
            select: mockCampaignFetch({
              id: "c-1",
              status: "in_review",
              source_type: "published_observance",
              source_occurrence_id: "occ-1",
            }),
          };
        }
        if (table === "marketing_campaign_variants") {
          return { select: mockVariantsFetch([{ ...validVariant, source_citations: [] }]) };
        }
        throw new Error("unexpected table");
      }),
    };

    await expect(approveCampaign(mockSupabase as any, "c-1", "admin")).rejects.toThrow(/source_citations/);
  });

  it("stamps approved_manifest_hash and approved_content_version on every variant after a successful approval", async () => {
    const variantUpdateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: {}, error: null }),
    });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "marketing_campaigns") {
          return {
            select: mockCampaignFetch({ id: "c-1", status: "in_review", source_type: "manual" }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: "c-1", status: "approved", approved_by: "admin" },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "marketing_campaign_variants") {
          return {
            select: mockVariantsFetch([{ ...validVariant, content_version: 3 }]),
            update: variantUpdateSpy,
          };
        }
        throw new Error("unexpected table");
      }),
    };

    const approved = await approveCampaign(mockSupabase as any, "c-1", "admin");

    expect(approved.status).toBe("approved");
    expect(variantUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        approved_manifest_hash: expect.any(String),
        approved_content_version: 3,
      })
    );
  });
});

describe("cancelCampaign lifecycle guard", () => {
  it("rejects cancelling an already-completed or already-cancelled campaign", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }),
    };

    await expect(cancelCampaign(mockSupabase as any, "c-1")).rejects.toThrow(/completed\/cancelled|not found/);
  });
});
