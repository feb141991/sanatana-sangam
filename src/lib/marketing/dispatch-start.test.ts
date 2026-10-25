import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkDispatchPreconditions, maybeCompleteCampaign, startCampaignDispatch } from "./dispatch-start";
import { dispatchMarketingBatch } from "./dispatcher";
import { computeContentHash } from "./campaign-service";
import type { MarketingCampaign, MarketingCampaignVariant } from "./types";

// ── Doubles ────────────────────────────────────────────────────────────────────

let whatsappIsMock = false;
vi.mock("@/lib/whatsapp/provider", () => ({
  createWhatsAppProvider: () => ({ name: "mock", isMock: whatsappIsMock, sendText: vi.fn() })
}));
vi.mock("@/lib/email", () => ({ sendShoonayaEmail: vi.fn() }));

/** How many recipients the audience seeder "finds" this test, and what a preview reports. */
let eligibleToSeed = 0;
const seedCalls: Array<{ variantId: string; channel: string }> = [];
const previewCalls: string[] = [];
let state: { campaign: any; dispatches: any[] };

vi.mock("./audience", () => ({
  seedMarketingDispatches: async (_s: unknown, campaign: { id: string }, variantId: string, channel: string) => {
    seedCalls.push({ variantId, channel });
    for (let i = 0; i < eligibleToSeed; i++) {
      state.dispatches.push({ id: `d-${state.dispatches.length}`, campaign_id: campaign.id, variant_id: variantId, channel, status: "pending" });
    }
    return { seeded: eligibleToSeed };
  },
  previewMarketingAudience: async (_s: unknown, _c: unknown, channel: string) => {
    previewCalls.push(channel);
    return { total: 5, eligible: 3, suppressedByReason: { missing_marketing_consent: 2 } };
  }
}));

/** In-memory stand-in for the two tables the start logic touches; asserts on what is actually stored. */
function fakeSupabase() {
  const updates: Array<{ patch: any; matched: number }> = [];
  function from(table: string) {
    const filters: Array<[string, string, any]> = [];
    let mode: "select" | "update" = "select";
    let patch: any;
    let wantCount = false;
    const rows = () => (table === "marketing_dispatches" ? state.dispatches : [state.campaign]);
    const matches = (r: any) => filters.every(([op, k, v]) => (op === "eq" ? r[k] === v : (v as any[]).includes(r[k])));
    const execute = () => {
      const matched = rows().filter(matches);
      if (mode === "update") {
        matched.forEach((r) => Object.assign(r, patch));
        updates.push({ patch, matched: matched.length });
        return { data: matched.map((r) => ({ ...r })), error: null };
      }
      return wantCount ? { count: matched.length, error: null } : { data: matched.map((r) => ({ ...r })), error: null };
    };
    const b: any = {
      select(_c?: string, opts?: { count?: string }) { if (opts?.count) wantCount = true; return b; },
      update(p: any) { mode = "update"; patch = p; return b; },
      eq(k: string, v: any) { filters.push(["eq", k, v]); return b; },
      in(k: string, v: any[]) { filters.push(["in", k, v]); return b; },
      single() {
        const r: any = execute();
        const row = r.data?.[0];
        return Promise.resolve({ data: row ?? null, error: row ? null : { message: "no rows" } });
      },
      then(res: any, rej: any) { return Promise.resolve(execute()).then(res, rej); }
    };
    return b;
  }
  return { from, updates };
}

function campaign(overrides: Partial<MarketingCampaign> = {}): MarketingCampaign {
  return {
    id: "c-1", campaign_key: "k1", campaign_type: "newsletter", title: "Test", status: "approved", source_type: "manual",
    source_occurrence_id: null, source_verified_at: null, created_by: "admin", approved_by: "admin",
    approved_at: new Date().toISOString(), cancelled_at: null, created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(), ...overrides
  } as MarketingCampaign;
}

function variant(overrides: Partial<MarketingCampaignVariant> = {}): MarketingCampaignVariant {
  const base = {
    id: "v-1", campaign_id: "c-1", channel: "email" as const, locale: "en", subject: "S", body: "B", cta_text: "Read",
    cta_url: "https://www.shoonaya.com", source_snapshot: {}, source_citations: [] as unknown[], content_version: 1,
    approved_content_version: 1, generation_provenance: null, generation_metadata: null, created_at: new Date().toISOString(),
    ...overrides
  };
  const hash = computeContentHash({
    subject: base.subject, body: base.body, cta_text: base.cta_text, cta_url: base.cta_url,
    source_snapshot: base.source_snapshot, source_citations: base.source_citations, channel: base.channel, locale: base.locale
  });
  const approved = "approved_manifest_hash" in overrides ? overrides.approved_manifest_hash! : hash;
  return { ...base, content_hash: hash, approved_manifest_hash: approved } as MarketingCampaignVariant;
}

beforeEach(() => {
  state = { campaign: campaign(), dispatches: [] };
  eligibleToSeed = 0;
  seedCalls.length = 0;
  previewCalls.length = 0;
  whatsappIsMock = false;
});
afterEach(() => vi.unstubAllEnvs());

async function start(over: { c?: MarketingCampaign; v?: MarketingCampaignVariant; dryRun: boolean; channel?: "email" | "whatsapp" }) {
  const db = fakeSupabase();
  const res = await startCampaignDispatch(db, {
    campaign: over.c ?? state.campaign, variant: over.v ?? variant(), channel: over.channel ?? "email", dryRun: over.dryRun
  });
  return { res, db };
}

// ── The regression: dry run first, then the real send ──────────────────────────

describe("dry run then live send (the stuck / sent-to-nobody bug)", () => {
  it("a dry run changes nothing: status stays approved, no recipient rows, no writes", async () => {
    eligibleToSeed = 3;
    const { res, db } = await start({ dryRun: true });
    expect(res.ok).toBe(true);
    expect(state.campaign.status).toBe("approved");
    expect(state.dispatches).toHaveLength(0);
    expect(seedCalls).toHaveLength(0);
    expect(db.updates).toHaveLength(0);
  });

  it("a dry run on an unseeded campaign reports who a live send would reach", async () => {
    const { res } = await start({ dryRun: true });
    expect(res.ok && res.preview).toEqual({ total: 5, eligible: 3, suppressedByReason: { missing_marketing_consent: 2 } });
  });

  it("after a dry run, the live send seeds the audience and only then flips to dispatching", async () => {
    eligibleToSeed = 3;
    await start({ dryRun: true });
    const { res } = await start({ dryRun: false });
    expect(res.ok).toBe(true);
    expect(seedCalls).toHaveLength(1);
    expect(state.dispatches).toHaveLength(3);
    expect(state.dispatches.every((d) => d.status === "pending")).toBe(true);
    expect(state.campaign.status).toBe("dispatching");
  });
});

describe("repairing a campaign a dry run already left in 'dispatching' with no recipients", () => {
  it("the next live send seeds the missing audience instead of sending to nobody", async () => {
    state.campaign = campaign({ status: "dispatching" });
    eligibleToSeed = 2;
    const { res } = await start({ dryRun: false });
    expect(res.ok).toBe(true);
    expect(seedCalls).toHaveLength(1);
    expect(state.dispatches).toHaveLength(2);
    expect(state.campaign.status).toBe("dispatching");
  });

  it("if nobody is eligible it goes back to 'approved' (it sent nothing) instead of staying stuck", async () => {
    state.campaign = campaign({ status: "dispatching" });
    eligibleToSeed = 0;
    const { res } = await start({ dryRun: false });
    expect(res).toMatchObject({ ok: false, status: 409, code: "no_eligible_recipients" });
    expect(state.campaign.status).toBe("approved");
  });

  it("does NOT revert a 'dispatching' campaign that has already queued recipients on another channel", async () => {
    state.campaign = campaign({ status: "dispatching" });
    state.dispatches.push({ id: "d-x", campaign_id: "c-1", variant_id: "v-other", channel: "whatsapp", status: "sent" });
    eligibleToSeed = 0;
    const { res } = await start({ dryRun: false, channel: "email" });
    expect(res).toMatchObject({ ok: false, code: "no_eligible_recipients" });
    expect(state.campaign.status).toBe("dispatching");
  });

  it("does not re-seed when this variant already has recipients (continue-draining)", async () => {
    state.campaign = campaign({ status: "dispatching" });
    state.dispatches.push({ id: "d-1", campaign_id: "c-1", variant_id: "v-1", channel: "email", status: "pending" });
    const { res } = await start({ dryRun: false });
    expect(res.ok).toBe(true);
    expect(seedCalls).toHaveLength(0);
  });
});

describe("a live send with nobody to send to", () => {
  it("is refused with a clear reason and the campaign is never flipped", async () => {
    eligibleToSeed = 0;
    const { res, db } = await start({ dryRun: false });
    expect(res).toMatchObject({ ok: false, status: 409, code: "no_eligible_recipients" });
    expect(state.campaign.status).toBe("approved");
    expect(db.updates).toHaveLength(0);
  });
});

describe("every failure is reported before the status changes", () => {
  it("variant edited since approval: 409, status untouched, nothing seeded", async () => {
    eligibleToSeed = 3;
    const { res, db } = await start({ dryRun: false, v: variant({ approved_manifest_hash: "stale" }) });
    expect(res).toMatchObject({ ok: false, status: 409, code: "variant_changed_since_approval" });
    expect(state.campaign.status).toBe("approved");
    expect(state.dispatches).toHaveLength(0);
    expect(db.updates).toHaveLength(0);
  });

  it("WhatsApp on the mock provider in production: 409 before anything is written", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    whatsappIsMock = true;
    eligibleToSeed = 3;
    const { res } = await start({ dryRun: false, channel: "whatsapp", v: variant({ channel: "whatsapp" }) });
    expect(res).toMatchObject({ ok: false, status: 409, code: "whatsapp_provider_not_configured" });
    expect(state.campaign.status).toBe("approved");
    expect(state.dispatches).toHaveLength(0);
  });

  it("the same WhatsApp condition does not block a dry run", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    whatsappIsMock = true;
    const { res } = await start({ dryRun: true, channel: "whatsapp", v: variant({ channel: "whatsapp" }) });
    expect(res.ok).toBe(true);
  });

  it.each(["draft", "in_review", "completed", "cancelled"] as const)("a %s campaign cannot be dispatched", async (status) => {
    state.campaign = campaign({ status });
    for (const dryRun of [true, false]) {
      const { res } = await start({ dryRun });
      expect(res).toMatchObject({ ok: false, status: 409, code: "not_approved" });
    }
    expect(state.campaign.status).toBe(status);
  });
});

describe("two requests starting at once", () => {
  it("a request that loses the flip but finds the campaign already dispatching carries on", async () => {
    eligibleToSeed = 2;
    // The snapshot this request holds says approved, but another request flipped it first.
    const snapshot = campaign({ status: "approved" });
    state.campaign = campaign({ status: "dispatching" });
    const { res } = await start({ dryRun: false, c: snapshot });
    expect(res.ok).toBe(true);
    expect(res.ok && res.campaign.status).toBe("dispatching");
  });

  it("a request that loses the flip because the campaign was cancelled is refused", async () => {
    eligibleToSeed = 2;
    const snapshot = campaign({ status: "approved" });
    state.campaign = campaign({ status: "cancelled" });
    const { res } = await start({ dryRun: false, c: snapshot });
    expect(res).toMatchObject({ ok: false, status: 409, code: "status_changed" });
    expect(state.campaign.status).toBe("cancelled");
  });
});

// ── Completion ─────────────────────────────────────────────────────────────────

describe("maybeCompleteCampaign", () => {
  it("never completes a campaign that has no recipient rows at all (it sent nothing)", async () => {
    state.campaign = campaign({ status: "dispatching" });
    expect(await maybeCompleteCampaign(fakeSupabase(), "c-1")).toBeNull();
    expect(state.campaign.status).toBe("dispatching");
  });

  it("does not complete while recipients are pending or claimed", async () => {
    state.campaign = campaign({ status: "dispatching" });
    state.dispatches.push({ id: "d1", campaign_id: "c-1", status: "sent" }, { id: "d2", campaign_id: "c-1", status: "claimed" });
    expect(await maybeCompleteCampaign(fakeSupabase(), "c-1")).toBeNull();
    expect(state.campaign.status).toBe("dispatching");
  });

  it.each(["retryable", "outcome_unknown"])(
    "does not complete while a recipient is %s",
    async (status) => {
      state.campaign = campaign({ status: "dispatching" });
      state.dispatches.push(
        { id: "d1", campaign_id: "c-1", status: "sent" },
        { id: "d2", campaign_id: "c-1", status }
      );
      expect(await maybeCompleteCampaign(fakeSupabase(), "c-1")).toBeNull();
      expect(state.campaign.status).toBe("dispatching");
    }
  );

  it("completes once every recipient row has reached a final status", async () => {
    state.campaign = campaign({ status: "dispatching" });
    state.dispatches.push({ id: "d1", campaign_id: "c-1", status: "sent" }, { id: "d2", campaign_id: "c-1", status: "suppressed" });
    expect(await maybeCompleteCampaign(fakeSupabase(), "c-1")).toBe("completed");
    expect(state.campaign.status).toBe("completed");
  });
});

// ── Parity with the guards inside the dispatcher ───────────────────────────────

describe("early checks agree with the guards inside dispatchMarketingBatch", () => {
  it("edited-since-approval: both refuse, with the same message", async () => {
    const v = variant({ approved_manifest_hash: "stale" });
    const early = checkDispatchPreconditions(v, false);
    await expect(dispatchMarketingBatch(fakeSupabase(), { campaign: campaign(), variant: v, dryRun: false })).rejects.toThrow(early!.error);
  });

  it("WhatsApp mock in production: both refuse live sends, both allow dry runs", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    whatsappIsMock = true;
    const v = variant({ channel: "whatsapp" });
    const early = checkDispatchPreconditions(v, false);
    expect(early?.code).toBe("whatsapp_provider_not_configured");
    await expect(dispatchMarketingBatch(fakeSupabase(), { campaign: campaign(), variant: v, dryRun: false })).rejects.toThrow(early!.error);
    expect(checkDispatchPreconditions(v, true)).toBeNull();
  });

  it("a healthy approved variant passes the early checks", () => {
    expect(checkDispatchPreconditions(variant(), false)).toBeNull();
  });
});
