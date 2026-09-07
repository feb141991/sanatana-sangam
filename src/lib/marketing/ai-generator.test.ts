import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateMarketingDraft } from "./ai-generator";

const generateWithProvider = vi.fn();
vi.mock("@/lib/ai/providers/inference", () => ({
  generateWithProvider: (...args: unknown[]) => generateWithProvider(...args)
}));

/** Generic thenable query-builder mock, matching the pattern used in
 * dispatcher.test.ts: every chain method returns itself, awaiting resolves to the
 * configured {data, error}. Robust against the exact chain shape each call site uses. */
function makeThenable(data: any, error: any = null) {
  const builder: any = {};
  const chain = () => builder;
  for (const method of ["select", "eq", "in", "not", "order", "limit", "gt", "insert", "upsert", "update", "single", "maybeSingle"]) {
    builder[method] = chain;
  }
  builder.then = (resolve: any) => resolve({ data, error });
  return builder;
}

interface MockConfig {
  occurrence?: any;
  campaign?: any;
  campaignForSaveVariant?: any;
  variant?: any;
}

function createMockSupabase(config: MockConfig) {
  let campaignSelectCallCount = 0;

  return {
    from: (table: string) => {
      if (table === "observance_occurrences") {
        return makeThenable(config.occurrence ?? null);
      }
      if (table === "marketing_campaigns") {
        campaignSelectCallCount++;
        // createCampaign uses .insert(...).select().single(); saveVariant (called
        // afterwards, for each variant) uses .select().eq().single() to check status.
        // Route both through the same thenable since it resolves regardless of which
        // chain methods are actually invoked.
        return makeThenable(campaignSelectCallCount === 1 ? config.campaign : (config.campaignForSaveVariant ?? config.campaign));
      }
      if (table === "marketing_campaign_variants") {
        return makeThenable(config.variant);
      }
      throw new Error(`unexpected table ${table}`);
    }
  };
}

const draftCampaign = {
  id: "c-1",
  campaign_key: "k1",
  title: "Test",
  status: "draft",
  source_type: "manual",
  source_occurrence_id: null,
  source_verified_at: null,
  created_by: "ai"
};

describe("generateMarketingDraft", () => {
  beforeEach(() => {
    generateWithProvider.mockReset();
  });

  it("fails closed and calls the model zero times when no channels are requested", async () => {
    const supabase = createMockSupabase({});
    const result = await generateMarketingDraft(supabase, {
      campaignKey: "k1",
      title: "Test",
      campaignType: "newsletter",
      channels: [],
      createdBy: "ai"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("no_channels_requested");
    expect(generateWithProvider).not.toHaveBeenCalled();
  });

  it("fails closed when the source occurrence is not currently publishable, before calling the model", async () => {
    const supabase = createMockSupabase({ occurrence: null });
    const result = await generateMarketingDraft(supabase, {
      campaignKey: "k1",
      title: "Test",
      campaignType: "festival_reminder",
      channels: ["email"],
      createdBy: "ai",
      sourceOccurrenceId: "occ-withheld"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("source_occurrence_not_publishable");
    expect(generateWithProvider).not.toHaveBeenCalled();
  });

  it("fails closed and produces nothing further when generation returns empty content", async () => {
    generateWithProvider.mockResolvedValue({ text: '{"subject": "", "body": ""}', modelUsed: "m", provider: "p" });
    const supabase = createMockSupabase({ campaign: draftCampaign });

    const result = await generateMarketingDraft(supabase, {
      campaignKey: "k1",
      title: "Test",
      campaignType: "newsletter",
      channels: ["email"],
      createdBy: "ai"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/empty_content/);
  });

  it("fails closed when the model call itself throws", async () => {
    generateWithProvider.mockRejectedValue(new Error("provider unavailable"));
    const supabase = createMockSupabase({ campaign: draftCampaign });

    const result = await generateMarketingDraft(supabase, {
      campaignKey: "k1",
      title: "Test",
      campaignType: "newsletter",
      channels: ["email"],
      createdBy: "ai"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/generation_failed_email/);
  });

  it("creates a manual campaign in draft status with an empty citation list (no source to cite)", async () => {
    generateWithProvider.mockResolvedValue({
      text: '{"subject": "Weekly Dharma", "body": "Explore this week\'s practice.", "cta_text": "Explore", "cta_url": "/panchang"}',
      modelUsed: "sarvam-m1",
      provider: "sarvam-hosted"
    });

    const savedVariant = {
      id: "v-1",
      campaign_id: "c-1",
      channel: "email",
      source_citations: [],
      generation_provenance: { model_used: "sarvam-m1" }
    };
    const supabase = createMockSupabase({ campaign: draftCampaign, campaignForSaveVariant: { status: "draft" }, variant: savedVariant });

    const result = await generateMarketingDraft(supabase, {
      campaignKey: "k1",
      title: "Test",
      campaignType: "newsletter",
      channels: ["email"],
      createdBy: "ai"
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.campaign.status).toBe("draft");
      expect(result.variants).toHaveLength(1);
      expect(result.variants[0].source_citations).toEqual([]);
    }
  });

  it("attaches a non-empty source citation for a published_observance campaign", async () => {
    generateWithProvider.mockResolvedValue({
      text: '{"subject": "Diwali in 3 days", "body": "Set your reminder.", "cta_text": "Explore", "cta_url": "/panchang"}',
      modelUsed: "sarvam-m1",
      provider: "sarvam-hosted"
    });

    const occurrence = {
      id: "occ-1",
      date: "2026-11-08",
      publication_status: "published",
      observance_definitions: { slug: "diwali", display_name: "Diwali", tradition: "hindu", source: "CANONICAL_RULES" }
    };
    const savedVariant = {
      id: "v-1",
      campaign_id: "c-1",
      channel: "email",
      source_citations: [{ source: "CANONICAL_RULES", occurrence_id: "occ-1", slug: "diwali" }],
      generation_provenance: { model_used: "sarvam-m1" }
    };
    const campaign = { ...draftCampaign, source_type: "published_observance", source_occurrence_id: "occ-1" };
    const supabase = createMockSupabase({
      occurrence,
      campaign,
      campaignForSaveVariant: { status: "draft" },
      variant: savedVariant
    });

    const result = await generateMarketingDraft(supabase, {
      campaignKey: "k1",
      title: "Test",
      campaignType: "festival_reminder",
      channels: ["email"],
      createdBy: "ai",
      sourceOccurrenceId: "occ-1"
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.variants[0].source_citations).not.toEqual([]);
    }

    const userPrompt = generateWithProvider.mock.calls[0][0].user as string;
    expect(userPrompt).toContain("fixed fact");
    expect(userPrompt).toContain("Diwali");
  });
});
