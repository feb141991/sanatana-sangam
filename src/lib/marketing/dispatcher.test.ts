import { describe, it, expect, vi, beforeEach } from "vitest";
import { dispatchMarketingBatch, sanitizeErrorCode, variantMatchesApprovedManifest } from "./dispatcher";
import { computeContentHash } from "./campaign-service";
import type { MarketingCampaign, MarketingCampaignVariant, MarketingDispatch } from "./types";

const sendShoonayaEmail = vi.fn();
vi.mock("@/lib/email", () => ({
  sendShoonayaEmail: (...args: unknown[]) => sendShoonayaEmail(...args)
}));

const whatsappSendText = vi.fn();
let whatsappIsMock = false;
vi.mock("@/lib/whatsapp/provider", () => ({
  createWhatsAppProvider: () => ({
    name: "mock",
    isMock: whatsappIsMock,
    sendText: (...args: unknown[]) => whatsappSendText(...args)
  })
}));

function baseCampaign(overrides: Partial<MarketingCampaign> = {}): MarketingCampaign {
  return {
    id: "c-1",
    campaign_key: "k1",
    campaign_type: "newsletter",
    title: "Test Campaign",
    status: "approved",
    source_type: "manual",
    source_occurrence_id: null,
    source_verified_at: null,
    created_by: "admin",
    approved_by: "admin",
    approved_at: new Date().toISOString(),
    cancelled_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

function approvedVariant(overrides: Partial<MarketingCampaignVariant> = {}): MarketingCampaignVariant {
  const base = {
    id: "v-1",
    campaign_id: "c-1",
    channel: "email" as const,
    locale: "en",
    subject: "Weekly Reflection",
    body: "Sacred text body",
    cta_text: "Read",
    cta_url: "https://shoonaya.com",
    source_snapshot: {},
    source_citations: [] as unknown[],
    content_version: 1,
    approved_content_version: 1,
    generation_provenance: null,
    generation_metadata: null,
    created_at: new Date().toISOString(),
    ...overrides
  };
  const computedHash = computeContentHash({
    subject: base.subject,
    body: base.body,
    cta_text: base.cta_text,
    cta_url: base.cta_url,
    source_snapshot: base.source_snapshot,
    source_citations: base.source_citations,
    channel: base.channel,
    locale: base.locale
  });
  const approved_manifest_hash =
    "approved_manifest_hash" in overrides ? overrides.approved_manifest_hash! : computedHash;
  return { ...base, content_hash: computedHash, approved_manifest_hash };
}

/** A minimal thenable query-builder mock: every chain method returns itself, and
 * awaiting it resolves to the configured {data, error} -- robust against the exact
 * method chain dispatcher.ts happens to use, unlike hand-matching every call shape. */
function makeThenable(data: any, error: any = null, onUpdate?: (patch: any) => void) {
  const builder: any = {};
  const chain = () => builder;
  for (const method of ["select", "eq", "in", "not", "order", "limit", "gt", "single", "maybeSingle"]) {
    builder[method] = chain;
  }
  builder.upsert = chain;
  builder.update = (patch: any) => {
    onUpdate?.(patch);
    return builder;
  };
  builder.then = (resolve: any) => resolve({ data, error });
  return builder;
}

interface MockConfig {
  pendingRows?: Array<{ id: string; recipient_user_id: string }>;
  claimedRows?: MarketingDispatch[];
  profiles?: Record<string, any>;
  emails?: Record<string, string>;
}

function createMockSupabase(config: MockConfig) {
  const dispatchUpdates: any[] = [];
  const claimCalls: any[] = [];

  const supabase = {
    from: (table: string) => {
      if (table === "marketing_dispatches") {
        return makeThenable(config.pendingRows ?? [], null, patch => dispatchUpdates.push(patch));
      }
      if (table === "profiles") {
        return {
          select: () => ({
            in: (_col: string, ids: string[]) =>
              Promise.resolve({
                data: ids.map(id => config.profiles?.[id]).filter(Boolean),
                error: null
              })
          })
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
    rpc: (fn: string, params: any) => {
      if (fn === "claim_marketing_dispatches") {
        claimCalls.push(params);
        return Promise.resolve({ data: config.claimedRows ?? [], error: null });
      }
      if (fn === "get_recipient_emails") {
        const ids: string[] = params.p_user_ids;
        return Promise.resolve({
          data: ids.map(id => ({ id, email: config.emails?.[id] ?? null })),
          error: null
        });
      }
      throw new Error(`unexpected rpc ${fn}`);
    }
  };

  return { supabase, dispatchUpdates, claimCalls };
}

describe("Marketing Campaign Dispatcher", () => {
  beforeEach(() => {
    sendShoonayaEmail.mockClear();
    whatsappSendText.mockClear();
    whatsappIsMock = false;
    (process.env as any).NODE_ENV = "test";
    (process.env as any).VERCEL_ENV = "test";
  });

  it("sanitizes error codes safely without leaking PII or raw provider payloads", () => {
    expect(sanitizeErrorCode(new Error("Rate limit exceeded 429"))).toBe("rate_limited");
    expect(sanitizeErrorCode(new Error("Invalid API key secret_12345"))).toBe("auth_failed");
    expect(sanitizeErrorCode("Recipient invalid_user@example.com is invalid")).toBe("invalid_recipient");
    expect(sanitizeErrorCode(null)).toBe("unknown_error");
  });

  describe("variantMatchesApprovedManifest", () => {
    it("matches when the variant is unchanged since approval", () => {
      expect(variantMatchesApprovedManifest(approvedVariant())).toBe(true);
    });

    it("does not match when there is no approved_manifest_hash at all", () => {
      expect(variantMatchesApprovedManifest(approvedVariant({ approved_manifest_hash: null }))).toBe(false);
    });

    it("does not match after the body changes post-approval", () => {
      const variant = approvedVariant();
      variant.body = "Edited after approval";
      expect(variantMatchesApprovedManifest(variant)).toBe(false);
    });
  });

  it("rejects dispatching a campaign that is not approved or dispatching", async () => {
    const { supabase } = createMockSupabase({});
    await expect(
      dispatchMarketingBatch(supabase, { campaign: baseCampaign({ status: "draft" }), variant: approvedVariant() })
    ).rejects.toThrow(/draft/);
  });

  it("rejects dispatching when the variant no longer matches its approved manifest", async () => {
    const { supabase } = createMockSupabase({});
    const variant = approvedVariant();
    variant.body = "Edited after approval, campaign not re-approved";
    await expect(dispatchMarketingBatch(supabase, { campaign: baseCampaign(), variant })).rejects.toThrow(
      /no longer matches its approved manifest/
    );
  });

  it("dry run previews pending rows, evaluates consent, and calls neither the claim RPC nor any provider", async () => {
    const { supabase, claimCalls } = createMockSupabase({
      pendingRows: [
        { id: "d-1", recipient_user_id: "u-1" },
        { id: "d-2", recipient_user_id: "u-2" }
      ],
      profiles: {
        "u-1": { id: "u-1", marketing_consent: true, email_newsletter: true, is_banned: false },
        "u-2": { id: "u-2", marketing_consent: false, email_newsletter: true, is_banned: false }
      },
      emails: { "u-1": "user1@shoonaya.com", "u-2": "user2@shoonaya.com" }
    });

    const result = await dispatchMarketingBatch(supabase, {
      campaign: baseCampaign(),
      variant: approvedVariant(),
      dryRun: true
    });

    expect(result.dryRun).toBe(true);
    expect(result.sent).toBe(1);
    expect(result.suppressed).toBe(1);
    expect(sendShoonayaEmail).not.toHaveBeenCalled();
    expect(claimCalls).toHaveLength(0);
  });

  it("live dispatch claims a batch, sends only to consent-eligible recipients, and marks the rest suppressed without a provider call", async () => {
    sendShoonayaEmail.mockResolvedValue({ success: true });

    const { supabase, dispatchUpdates, claimCalls } = createMockSupabase({
      claimedRows: [
        { id: "d-1", campaign_id: "c-1", variant_id: "v-1", recipient_user_id: "u-1", channel: "email", status: "claimed" } as any,
        { id: "d-2", campaign_id: "c-1", variant_id: "v-1", recipient_user_id: "u-2", channel: "email", status: "claimed" } as any
      ],
      profiles: {
        "u-1": { id: "u-1", marketing_consent: true, email_newsletter: true, is_banned: false, unsubscribe_token: "t1" },
        "u-2": { id: "u-2", marketing_consent: false, email_newsletter: true, is_banned: false, unsubscribe_token: "t2" }
      },
      emails: { "u-1": "user1@shoonaya.com", "u-2": "user2@shoonaya.com" }
    });

    const result = await dispatchMarketingBatch(supabase, {
      campaign: baseCampaign(),
      variant: approvedVariant(),
      dryRun: false
    });

    expect(claimCalls).toHaveLength(1);
    expect(claimCalls[0]).toMatchObject({ p_campaign_id: "c-1", p_variant_id: "v-1", p_channel: "email" });
    expect(sendShoonayaEmail).toHaveBeenCalledTimes(1);
    expect(result.sent).toBe(1);
    expect(result.suppressed).toBe(1);
    expect(dispatchUpdates.some(u => u.status === "sent")).toBe(true);
    expect(dispatchUpdates.some(u => u.status === "suppressed")).toBe(true);
  });

  it("records a provider failure as 'failed' (retryable), not as a crash of the whole batch", async () => {
    sendShoonayaEmail
      .mockResolvedValueOnce({ success: false, error: "Network timeout 504" })
      .mockResolvedValueOnce({ success: true });

    const { supabase, dispatchUpdates } = createMockSupabase({
      claimedRows: [
        { id: "d-1", campaign_id: "c-1", variant_id: "v-1", recipient_user_id: "u-1", channel: "email", status: "claimed" } as any,
        { id: "d-2", campaign_id: "c-1", variant_id: "v-1", recipient_user_id: "u-2", channel: "email", status: "claimed" } as any
      ],
      profiles: {
        "u-1": { id: "u-1", marketing_consent: true, email_newsletter: true, is_banned: false },
        "u-2": { id: "u-2", marketing_consent: true, email_newsletter: true, is_banned: false }
      },
      emails: { "u-1": "user1@shoonaya.com", "u-2": "user2@shoonaya.com" }
    });

    const result = await dispatchMarketingBatch(supabase, {
      campaign: baseCampaign(),
      variant: approvedVariant(),
      dryRun: false
    });

    expect(result.failed).toBe(1);
    expect(result.sent).toBe(1);
    expect(result.dispatches[0].status).toBe("failed");
    expect(result.dispatches[0].error_code).toBe("timeout");
    expect(result.dispatches[1].status).toBe("sent");
    expect(dispatchUpdates.some(u => u.status === "failed" && u.last_error_code === "timeout")).toBe(true);
  });

  it("fails closed: refuses to dispatch a live WhatsApp campaign in production against a mock provider", async () => {
    whatsappIsMock = true;
    (process.env as any).NODE_ENV = "production";

    const { supabase } = createMockSupabase({ claimedRows: [] });

    await expect(
      dispatchMarketingBatch(supabase, {
        campaign: baseCampaign(),
        variant: approvedVariant({ channel: "whatsapp" }),
        dryRun: false
      })
    ).rejects.toThrow(/mock provider/);

    expect(whatsappSendText).not.toHaveBeenCalled();
  });
});
