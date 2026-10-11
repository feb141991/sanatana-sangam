import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  verifyAdminCookieAuth: vi.fn(),
  requireAdminAccess: vi.fn(),
  sendShoonayaEmail: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  verifyAdminCookieAuth: mocks.verifyAdminCookieAuth,
}));
vi.mock("@/lib/admin", () => ({
  requireAdminAccess: mocks.requireAdminAccess,
}));
vi.mock("@/lib/email", () => ({
  sendShoonayaEmail: mocks.sendShoonayaEmail,
}));

import { POST } from "./route";

function request(body: unknown) {
  return new NextRequest("https://www.shoonaya.com/api/admin/marketing/campaigns/c-1/test-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function campaignClient(campaign: Record<string, unknown> | null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: campaign, error: campaign ? null : { code: "not_found" } }),
        }),
      }),
    }),
  };
}

describe("campaign test-email route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyAdminCookieAuth.mockResolvedValue(null);
  });

  it("requires an explicit valid recipient and does not query the campaign", async () => {
    const supabase = campaignClient(null);
    mocks.requireAdminAccess.mockResolvedValue({ username: "admin", supabase });

    const response = await POST(request({}), { params: Promise.resolve({ id: "c-1" }) });

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(supabase.from).not.toHaveBeenCalled();
    expect(mocks.sendShoonayaEmail).not.toHaveBeenCalled();
  });

  it("refuses to send when no saved email variant exists", async () => {
    const supabase = campaignClient({ id: "c-1", title: "Campaign", marketing_campaign_variants: [] });
    mocks.requireAdminAccess.mockResolvedValue({ username: "admin", supabase });

    const response = await POST(request({ recipientEmail: "info@shoonaya.com" }), {
      params: Promise.resolve({ id: "c-1" }),
    });

    expect(response.status).toBe(400);
    expect(mocks.sendShoonayaEmail).not.toHaveBeenCalled();
  });

  it("sends the saved variant without a fake unsubscribe URL", async () => {
    const supabase = campaignClient({
      id: "c-1",
      title: "Campaign",
      campaign_type: "newsletter",
      marketing_campaign_variants: [{
        channel: "email",
        subject: "Weekly Dharma",
        body: "Saved preview body",
        cta_text: "Read more",
        cta_url: "https://www.shoonaya.com/discover",
      }],
    });
    mocks.requireAdminAccess.mockResolvedValue({ username: "admin", supabase });
    mocks.sendShoonayaEmail.mockResolvedValue({ success: true, id: "email-1" });

    const response = await POST(request({ recipientEmail: "INFO@SHOONAYA.COM" }), {
      params: Promise.resolve({ id: "c-1" }),
    });

    expect(response.status).toBe(200);
    expect(mocks.sendShoonayaEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "info@shoonaya.com",
        subject: "[PREVIEW TEST] Weekly Dharma",
        body: "Saved preview body",
        ctaText: "Read more",
        ctaUrl: "https://www.shoonaya.com/discover",
      }),
      expect.objectContaining({ idempotencyKey: expect.stringMatching(/^test-email:c-1:/) }),
    );
    const emailOptions = mocks.sendShoonayaEmail.mock.calls[0][0] as Record<string, unknown>;
    expect(emailOptions).not.toHaveProperty("unsubUrl");
  });

  it("returns a stable provider error without leaking provider details", async () => {
    const supabase = campaignClient({
      id: "c-1",
      title: "Campaign",
      marketing_campaign_variants: [{ channel: "email", subject: "Subject", body: "Body" }],
    });
    mocks.requireAdminAccess.mockResolvedValue({ username: "admin", supabase });
    mocks.sendShoonayaEmail.mockResolvedValue({
      success: false,
      error: "provider_http_500_secret_detail",
      retryable: true,
    });

    const response = await POST(request({ recipientEmail: "info@shoonaya.com" }), {
      params: Promise.resolve({ id: "c-1" }),
    });
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload.error).toBe("The email provider could not send this preview.");
    expect(JSON.stringify(payload)).not.toContain("secret_detail");
  });
});
