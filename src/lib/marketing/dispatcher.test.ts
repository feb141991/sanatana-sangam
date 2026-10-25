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
  resolveError?: { message: string } | null;
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
        return Promise.resolve({
          data: (config.claimedRows ?? []).map((row, index) => ({
            ...row,
            claim_token: row.claim_token ?? `claim-${index + 1}`,
          })),
          error: null,
        });
      }
      if (fn === "resolve_marketing_dispatch") {
        dispatchUpdates.push({
          status: params.p_status,
          provider: params.p_provider,
          provider_message_id: params.p_provider_message_id,
          last_error_code: params.p_error_code,
          claim_token: params.p_claim_token,
        });
        if (config.resolveError) {
          return Promise.resolve({ data: null, error: config.resolveError });
        }
        return Promise.resolve({ data: [{ id: params.p_dispatch_id, status: params.p_status }], error: null });
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
        "u-1": { id: "u-1", marketing_consent: true, email_newsletter: true, is_banned: false, unsubscribe_token: "t1" },
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
    sendShoonayaEmail.mockResolvedValue({ success: true, id: "resend_msg_1" });

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
    expect(sendShoonayaEmail.mock.calls[0][1]).toEqual({ idempotencyKey: "marketing-dispatch:d-1" });
    expect(sendShoonayaEmail.mock.calls[0][0]).toMatchObject({ unsubType: "newsletter" });
    expect(sendShoonayaEmail.mock.calls[0][0].unsubUrl).toContain("token=t1");
    expect(result.sent).toBe(1);
    expect(result.suppressed).toBe(1);
    expect(dispatchUpdates.some(u => u.status === "sent")).toBe(true);
    expect(dispatchUpdates.some(u => u.provider_message_id === "resend_msg_1")).toBe(true);
    expect(dispatchUpdates.some(u => u.status === "suppressed")).toBe(true);
  });

  it("records a retryable email provider failure separately and continues the batch", async () => {
    sendShoonayaEmail
      .mockResolvedValueOnce({ success: false, error: "Network timeout 504", retryable: true, status: 504 })
      .mockResolvedValueOnce({ success: true, id: "resend_msg_2" });

    const { supabase, dispatchUpdates } = createMockSupabase({
      claimedRows: [
        { id: "d-1", campaign_id: "c-1", variant_id: "v-1", recipient_user_id: "u-1", channel: "email", status: "claimed" } as any,
        { id: "d-2", campaign_id: "c-1", variant_id: "v-1", recipient_user_id: "u-2", channel: "email", status: "claimed" } as any
      ],
      profiles: {
        "u-1": { id: "u-1", marketing_consent: true, email_newsletter: true, is_banned: false, unsubscribe_token: "t1" },
        "u-2": { id: "u-2", marketing_consent: true, email_newsletter: true, is_banned: false, unsubscribe_token: "t2" }
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
    expect(result.retryable).toBe(1);
    expect(result.dispatches[0].status).toBe("retryable");
    expect(result.dispatches[0].error_code).toBe("timeout");
    expect(result.dispatches[1].status).toBe("sent");
    expect(dispatchUpdates.some(u => u.status === "retryable" && u.last_error_code === "timeout")).toBe(true);
  });

  it("records a non-retryable email rejection as a definitive failure", async () => {
    sendShoonayaEmail.mockResolvedValue({
      success: false,
      error: "provider_http_400",
      retryable: false,
      status: 400,
    });
    const { supabase, dispatchUpdates } = createMockSupabase({
      claimedRows: [
        { id: "d-1", campaign_id: "c-1", variant_id: "v-1", recipient_user_id: "u-1", channel: "email", status: "claimed" } as any,
      ],
      profiles: {
        "u-1": { id: "u-1", marketing_consent: true, email_newsletter: true, is_banned: false, unsubscribe_token: "t1" },
      },
      emails: { "u-1": "user1@shoonaya.com" },
    });

    const result = await dispatchMarketingBatch(supabase, {
      campaign: baseCampaign(),
      variant: approvedVariant(),
      dryRun: false,
    });

    expect(result.failed).toBe(1);
    expect(result.retryable).toBe(0);
    expect(result.dispatches[0].status).toBe("failed");
    expect(dispatchUpdates[0].status).toBe("failed");
  });

  it("quarantines an uncertain WhatsApp outcome instead of making it retryable", async () => {
    whatsappSendText.mockRejectedValue(new Error("Network timeout 504"));
    const { supabase, dispatchUpdates } = createMockSupabase({
      claimedRows: [
        { id: "d-1", campaign_id: "c-1", variant_id: "v-1", recipient_user_id: "u-1", channel: "whatsapp", status: "claimed" } as any,
      ],
      profiles: {
        "u-1": { id: "u-1", marketing_consent: true, whatsapp_opt_in: true, whatsapp_number: "+14155552671", is_banned: false },
      },
    });

    const result = await dispatchMarketingBatch(supabase, {
      campaign: baseCampaign(),
      variant: approvedVariant({ channel: "whatsapp" }),
      dryRun: false,
    });

    expect(result.outcomeUnknown).toBe(1);
    expect(result.retryable).toBe(0);
    expect(result.dispatches[0].status).toBe("outcome_unknown");
    expect(dispatchUpdates[0]).toMatchObject({ status: "outcome_unknown", last_error_code: "timeout" });
  });

  it("does not report provider success when the token-bound ledger finalization fails", async () => {
    sendShoonayaEmail.mockResolvedValue({ success: true, id: "resend_msg_1" });
    const { supabase } = createMockSupabase({
      claimedRows: [
        { id: "d-1", campaign_id: "c-1", variant_id: "v-1", recipient_user_id: "u-1", channel: "email", status: "claimed" } as any,
      ],
      profiles: {
        "u-1": { id: "u-1", marketing_consent: true, email_newsletter: true, is_banned: false, unsubscribe_token: "t1" },
      },
      emails: { "u-1": "user1@shoonaya.com" },
      resolveError: { message: "stale claim" },
    });

    await expect(dispatchMarketingBatch(supabase, {
      campaign: baseCampaign(),
      variant: approvedVariant(),
      dryRun: false,
    })).rejects.toThrow(/ledger finalization failed/);
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

describe("Marketing Campaign Dispatcher: tracked links", () => {
  beforeEach(() => {
    sendShoonayaEmail.mockReset();
    whatsappSendText.mockReset();
    whatsappIsMock = false;
    (process.env as any).NODE_ENV = "test";
    (process.env as any).VERCEL_ENV = "test";
  });

  const emailClaim = [{ id: "d-1", campaign_id: "c-1", variant_id: "v-1", recipient_user_id: "u-1", channel: "email", status: "claimed" } as any];
  const emailProfile = { "u-1": { id: "u-1", marketing_consent: true, email_newsletter: true, is_banned: false, unsubscribe_token: "t1" } };
  const queryOf = (url: string) => Object.fromEntries(new URL(url).searchParams);

  async function sendEmail(variant: MarketingCampaignVariant) {
    sendShoonayaEmail.mockResolvedValue({ success: true, id: "m1" });
    const { supabase } = createMockSupabase({ claimedRows: emailClaim, profiles: emailProfile, emails: { "u-1": "a@example.com" } });
    await dispatchMarketingBatch(supabase, { campaign: baseCampaign({ campaign_key: "diwali-2026" }), variant, dryRun: false });
    return sendShoonayaEmail.mock.calls[0][0];
  }

  it("a bare-homepage call to action is sent as the tagged smart app link", async () => {
    const sent = await sendEmail(approvedVariant({ cta_url: "https://www.shoonaya.com" }));
    expect(sent.ctaUrl.startsWith("https://www.shoonaya.com/get?")).toBe(true);
    expect(queryOf(sent.ctaUrl)).toEqual({ utm_source: "shoonaya", utm_medium: "email", utm_campaign: "diwali-2026", utm_content: "en" });
  });

  it("a specific page is kept and tagged", async () => {
    const sent = await sendEmail(approvedVariant({ cta_url: "https://www.shoonaya.com/festival/diwali" }));
    const url = new URL(sent.ctaUrl);
    expect(url.pathname).toBe("/festival/diwali");
    expect(url.searchParams.get("utm_campaign")).toBe("diwali-2026");
  });

  it("a missing call to action also becomes the smart link", async () => {
    const sent = await sendEmail(approvedVariant({ cta_url: null }));
    expect(new URL(sent.ctaUrl).pathname).toBe("/get");
  });

  it("links inside the email body are tagged; the unsubscribe link is not", async () => {
    const sent = await sendEmail(approvedVariant({ body: "Today: https://www.shoonaya.com/panchang" }));
    expect(sent.body).toContain("utm_campaign=diwali-2026");
    expect(sent.unsubUrl).toContain("token=t1");
    expect(sent.unsubUrl).not.toContain("utm_");
  });

  it("a third-party call to action is left exactly as approved", async () => {
    const sent = await sendEmail(approvedVariant({ cta_url: "https://example.com/offer" }));
    expect(sent.ctaUrl).toBe("https://example.com/offer");
  });

  it("WhatsApp: a plain 'shoonaya.com' mention is sent as the tagged smart link, with the messaging medium", async () => {
    whatsappSendText.mockResolvedValue({ messageId: "wa-1" });
    const { supabase } = createMockSupabase({
      claimedRows: [{ id: "d-1", campaign_id: "c-1", variant_id: "v-1", recipient_user_id: "u-1", channel: "whatsapp", status: "claimed" } as any],
      profiles: { "u-1": { id: "u-1", marketing_consent: true, whatsapp_opt_in: true, whatsapp_number: "+14155552671", is_banned: false } }
    });
    await dispatchMarketingBatch(supabase, {
      campaign: baseCampaign({ campaign_key: "diwali-2026" }),
      variant: approvedVariant({ channel: "whatsapp", body: "*Daily Dharma* Open Shoonaya: shoonaya.com or write to support@shoonaya.com" }),
      dryRun: false
    });
    const body: string = whatsappSendText.mock.calls[0][0].body;
    expect(body).toMatch(/Open Shoonaya: https:\/\/www\.shoonaya\.com\/get\?/);
    expect(body).toContain("utm_medium=messaging");
    expect(body).toContain("support@shoonaya.com");
  });

  it("tagging does not change the approved copy stored on the variant", async () => {
    const variant = approvedVariant({ cta_url: "https://www.shoonaya.com", body: "See https://www.shoonaya.com/panchang" });
    await sendEmail(variant);
    expect(variant.cta_url).toBe("https://www.shoonaya.com");
    expect(variant.body).toBe("See https://www.shoonaya.com/panchang");
    expect(variantMatchesApprovedManifest(variant)).toBe(true);
  });
});
