import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  draftChannelCopy: vi.fn(),
  createCampaign: vi.fn(),
  saveVariant: vi.fn(),
  cancelCampaign: vi.fn(),
  getPublishableOccurrenceById: vi.fn(),
  buildObservanceSourceSnapshot: vi.fn()
}));

vi.mock("../ai-generator", () => ({ draftChannelCopy: mocks.draftChannelCopy }));
vi.mock("../campaign-service", () => ({
  createCampaign: mocks.createCampaign,
  saveVariant: mocks.saveVariant,
  cancelCampaign: mocks.cancelCampaign
}));
vi.mock("../sources/published-observance", () => ({
  getPublishableOccurrenceById: mocks.getPublishableOccurrenceById,
  buildObservanceSourceSnapshot: mocks.buildObservanceSourceSnapshot
}));

import { diasporaCampaignKey, generateDiasporaDraft, type GenerateDiasporaInput } from "./service";

const clean = (channel: string) => ({
  subject: channel === "email" ? "A few steady minutes" : undefined,
  body: "Keep a few steady minutes in a full day, with a japa mala and the day's shloka.",
  cta_text: "Open Shoonaya",
  cta_url: "https://www.shoonaya.com",
  modelUsed: "m1",
  provider: "sarvam"
});

const base: GenerateDiasporaInput = {
  pillarId: "a_small_daily_anchor",
  regionId: "uk",
  tradition: null,
  channels: ["email", "whatsapp"],
  occurrenceId: null,
  createdBy: "founder"
};
const deps = { now: () => new Date("2026-10-16T05:00:00Z"), random: () => "ab12", env: {} };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.draftChannelCopy.mockImplementation(async ({ channel }: { channel: string }) => clean(channel));
  mocks.createCampaign.mockImplementation(async (_s: unknown, params: Record<string, unknown>) => ({ id: "camp-1", status: "draft", ...params }));
  mocks.saveVariant.mockImplementation(async (_s: unknown, params: Record<string, unknown>) => ({ id: `var-${params.channel}`, ...params }));
  mocks.cancelCampaign.mockResolvedValue({});
});

describe("a clean draft", () => {
  it("creates one draft campaign with one variant per channel, written by the founder", async () => {
    const result = await generateDiasporaDraft({}, base, deps);
    expect(result.ok).toBe(true);
    expect(mocks.createCampaign).toHaveBeenCalledTimes(1);
    expect(mocks.createCampaign.mock.calls[0][1]).toMatchObject({
      campaign_key: "diaspora-a-small-daily-anchor-uk-20261016-ab12",
      title: "Diaspora · A small daily anchor · United Kingdom",
      campaign_type: "announcement",
      source_type: "manual",
      created_by: "founder"
    });
    expect(mocks.saveVariant).toHaveBeenCalledTimes(2);
    expect(mocks.saveVariant.mock.calls.map((c) => c[1].channel).sort()).toEqual(["email", "whatsapp"]);
    if (result.ok) expect(result.attempts).toEqual({ email: 1, whatsapp: 1 });
  });

  it("never uses the newsletter type, whose writer instructions ask for scripture verses", async () => {
    await generateDiasporaDraft({}, base, deps);
    for (const call of mocks.draftChannelCopy.mock.calls) expect(call[0].campaignType).not.toBe("newsletter");
  });

  it("records the pillar, region and that the checks passed, so a reviewer can see how it was made", async () => {
    await generateDiasporaDraft({}, { ...base, regionId: "canada", tradition: "sikh" }, deps);
    const variant = mocks.saveVariant.mock.calls[0][1];
    expect(variant.generation_provenance.diaspora).toMatchObject({ pillar: "a_small_daily_anchor", region: "canada", tradition: "sikh", attempts: 1 });
    expect(variant.generation_metadata).toMatchObject({ diaspora_pillar: "a_small_daily_anchor", diaspora_region: "canada", content_check: "passed" });
  });

  it("gives the writer the brief and the target tradition", async () => {
    await generateDiasporaDraft({}, { ...base, tradition: "jain" }, deps);
    const call = mocks.draftChannelCopy.mock.calls[0][0];
    expect(call.targetTradition).toBe("jain");
    expect(call.strategyPrompt).toContain("DIASPORA CAMPAIGN BRIEF");
    expect(call.strategyPrompt).toContain("Jain temple (derasar)");
  });
});

describe("the content check", () => {
  it("a draft that breaks a rule is retried once, with the broken rule fed back, and the retry is what is saved", async () => {
    mocks.draftChannelCopy
      .mockResolvedValueOnce({ ...clean("whatsapp"), body: "Join 10,000 families keeping a daily practice." })
      .mockImplementation(async ({ channel }: { channel: string }) => clean(channel));
    const result = await generateDiasporaDraft({}, { ...base, channels: ["whatsapp"] }, deps);

    expect(result.ok).toBe(true);
    expect(mocks.draftChannelCopy).toHaveBeenCalledTimes(2);
    expect(mocks.draftChannelCopy.mock.calls[0][0].strategyPrompt).not.toContain("previous attempt");
    expect(mocks.draftChannelCopy.mock.calls[1][0].strategyPrompt).toContain("Your previous attempt broke these rules");
    expect(mocks.draftChannelCopy.mock.calls[1][0].strategyPrompt).toContain("10,000");
    expect(mocks.saveVariant.mock.calls[0][1].body).not.toContain("10,000");
    if (result.ok) expect(result.attempts).toEqual({ whatsapp: 2 });
  });

  it("a draft that still breaks the rules on the retry saves NOTHING and says why", async () => {
    mocks.draftChannelCopy.mockResolvedValue({ ...clean("email"), body: "Trusted by thousands of families." });
    const result = await generateDiasporaDraft({}, base, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("content_check_failed");
      expect(result.violations?.length).toBeGreaterThan(0);
      expect(result.violations?.every((v) => v.channel && v.rule && v.message)).toBe(true);
    }
    expect(mocks.createCampaign).not.toHaveBeenCalled();
    expect(mocks.saveVariant).not.toHaveBeenCalled();
  });

  it("if only one of two channels fails, nothing at all is saved (no half-made campaign)", async () => {
    mocks.draftChannelCopy.mockImplementation(async ({ channel }: { channel: string }) =>
      channel === "whatsapp" ? { ...clean("whatsapp"), body: "Never miss a festival again." } : clean(channel)
    );
    const result = await generateDiasporaDraft({}, base, deps);
    expect(result.ok).toBe(false);
    expect(mocks.createCampaign).not.toHaveBeenCalled();
    expect(mocks.saveVariant).not.toHaveBeenCalled();
  });

  it("the button text and subject are checked too", async () => {
    mocks.draftChannelCopy.mockResolvedValue({ ...clean("email"), cta_text: "Never miss a day" });
    expect((await generateDiasporaDraft({}, { ...base, channels: ["email"] }, deps)).ok).toBe(false);
  });

  it("Android is refused unless a Play listing is configured", async () => {
    mocks.draftChannelCopy.mockResolvedValue({ ...clean("email"), body: "Get the Android app today." });
    expect((await generateDiasporaDraft({}, { ...base, channels: ["email"] }, deps)).ok).toBe(false);
    mocks.draftChannelCopy.mockResolvedValue({ ...clean("email"), body: "Get the Android app today." });
    const withPlay = await generateDiasporaDraft({}, { ...base, channels: ["email"] }, {
      ...deps,
      env: { NATIVE_APP_STORE_URL_ANDROID: "https://play.google.com/store/apps/details?id=com.shoonaya.app" }
    });
    expect(withPlay.ok).toBe(true);
  });
});

describe("a verified occasion", () => {
  const festival = { ...base, pillarId: "festival_season_ahead", occurrenceId: "occ-1" };

  beforeEach(() => {
    mocks.getPublishableOccurrenceById.mockResolvedValue({ id: "occ-1" });
    mocks.buildObservanceSourceSnapshot.mockReturnValue({ occurrence_id: "occ-1", slug: "diwali", display_name: "Diwali", date: "2026-11-08", tradition: "hindu", verified_source: "CANONICAL_RULES" });
  });

  it("grounds the campaign on it: festival_reminder type, published_observance source, the snapshot and citation on every variant", async () => {
    const result = await generateDiasporaDraft({}, festival, deps);
    expect(result.ok).toBe(true);
    expect(mocks.createCampaign.mock.calls[0][1]).toMatchObject({ campaign_type: "festival_reminder", source_type: "published_observance", source_occurrence_id: "occ-1" });
    expect(mocks.draftChannelCopy.mock.calls[0][0].sourceSnapshot).toMatchObject({ display_name: "Diwali", date: "2026-11-08" });
    expect(mocks.saveVariant.mock.calls[0][1].source_citations).toEqual([{ source: "CANONICAL_RULES", occurrence_id: "occ-1", slug: "diwali" }]);
  });

  it("the occasion's own date may appear in the copy; any other date may not", async () => {
    mocks.draftChannelCopy.mockImplementation(async ({ channel }: { channel: string }) => ({ ...clean(channel), body: "Diwali falls on 8 November this year." }));
    expect((await generateDiasporaDraft({}, festival, deps)).ok).toBe(true);

    vi.clearAllMocks();
    mocks.createCampaign.mockImplementation(async (_s: unknown, p: Record<string, unknown>) => ({ id: "camp-2", ...p }));
    mocks.getPublishableOccurrenceById.mockResolvedValue({ id: "occ-1" });
    mocks.buildObservanceSourceSnapshot.mockReturnValue({ occurrence_id: "occ-1", slug: "diwali", display_name: "Diwali", date: "2026-11-08", verified_source: "CANONICAL_RULES" });
    mocks.draftChannelCopy.mockImplementation(async ({ channel }: { channel: string }) => ({ ...clean(channel), body: "Diwali falls on 9 November this year." }));
    expect((await generateDiasporaDraft({}, festival, deps)).ok).toBe(false);
    expect(mocks.createCampaign).not.toHaveBeenCalled();
  });

  it("an occasion that is not currently publishable stops everything before the model is called", async () => {
    mocks.getPublishableOccurrenceById.mockResolvedValue(null);
    const result = await generateDiasporaDraft({}, festival, deps);
    expect(result).toMatchObject({ ok: false, reason: "occasion_not_publishable" });
    expect(mocks.draftChannelCopy).not.toHaveBeenCalled();
    expect(mocks.createCampaign).not.toHaveBeenCalled();
  });

  it("the festival pillar cannot run without an occasion", async () => {
    const result = await generateDiasporaDraft({}, { ...festival, occurrenceId: null }, deps);
    expect(result).toMatchObject({ ok: false, reason: "occasion_required" });
    expect(mocks.draftChannelCopy).not.toHaveBeenCalled();
  });
});

describe("input is validated before anything is called", () => {
  it.each([
    [{ pillarId: "nope" }, "invalid_pillar"],
    [{ regionId: "mars" }, "invalid_region"],
    [{ tradition: "christian" }, "invalid_tradition"],
    [{ channels: [] }, "invalid_channels"],
    [{ channels: ["instagram"] }, "invalid_channels"],
    [{ channels: ["email", "twitter"] }, "invalid_channels"]
  ])("%j is refused as %s", async (patch, reason) => {
    const result = await generateDiasporaDraft({}, { ...base, ...patch } as GenerateDiasporaInput, deps);
    expect(result).toMatchObject({ ok: false, reason });
    expect(mocks.draftChannelCopy).not.toHaveBeenCalled();
    expect(mocks.createCampaign).not.toHaveBeenCalled();
  });

  it("a blank tradition means none, and repeated channels are written once", async () => {
    const result = await generateDiasporaDraft({}, { ...base, tradition: "", channels: ["email", "email"] }, deps);
    expect(result.ok).toBe(true);
    expect(mocks.saveVariant).toHaveBeenCalledTimes(1);
    expect(mocks.createCampaign.mock.calls[0][1].target_tradition).toBeNull();
  });
});

describe("failures leave nothing half-made", () => {
  it("a model error stops with the channel named and saves nothing", async () => {
    mocks.draftChannelCopy.mockRejectedValue(new Error("provider timeout"));
    const result = await generateDiasporaDraft({}, base, deps);
    expect(result).toMatchObject({ ok: false, reason: "generation_failed" });
    expect(mocks.createCampaign).not.toHaveBeenCalled();
  });

  it("an empty draft is refused, and an email without a subject counts as empty", async () => {
    mocks.draftChannelCopy.mockResolvedValue({ ...clean("email"), body: "   " });
    expect(await generateDiasporaDraft({}, base, deps)).toMatchObject({ ok: false, reason: "empty_content" });
    mocks.draftChannelCopy.mockResolvedValue({ ...clean("email"), subject: "  " });
    expect(await generateDiasporaDraft({}, { ...base, channels: ["email"] }, deps)).toMatchObject({ ok: false, reason: "empty_content" });
  });

  it("if the campaign cannot be created, no variant is attempted", async () => {
    mocks.createCampaign.mockRejectedValue(new Error("duplicate campaign_key"));
    expect(await generateDiasporaDraft({}, base, deps)).toMatchObject({ ok: false, reason: "campaign_creation_failed" });
    expect(mocks.saveVariant).not.toHaveBeenCalled();
  });

  it("if a variant cannot be saved, the campaign is cancelled rather than left with some channels missing", async () => {
    mocks.saveVariant.mockImplementation(async (_s: unknown, p: { channel: string }) => {
      if (p.channel === "whatsapp") throw new Error("write failed");
      return { id: "var-email", ...p };
    });
    const result = await generateDiasporaDraft({}, base, deps);
    expect(result).toMatchObject({ ok: false, reason: "variant_save_failed" });
    expect(mocks.cancelCampaign).toHaveBeenCalledWith({}, "camp-1");
  });
});

describe("diasporaCampaignKey", () => {
  it("is readable, dated and stays within a sane length", () => {
    expect(diasporaCampaignKey("which_day_where_i_live", "australia_nz", new Date("2026-10-16T00:00:00Z"), "ff00")).toBe("diaspora-which-day-where-i-live-australia-nz-20261016-ff00");
    expect(diasporaCampaignKey("x".repeat(300), "uk", new Date(), "ab").length).toBeLessThanOrEqual(120);
  });
});
