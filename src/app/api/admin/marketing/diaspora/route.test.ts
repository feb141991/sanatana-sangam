import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({ verifyAdminCookieAuth: vi.fn(), requireAdminAccess: vi.fn(), generateDiasporaDraft: vi.fn() }));

vi.mock("@/lib/admin-auth", () => ({ verifyAdminCookieAuth: mocks.verifyAdminCookieAuth }));
vi.mock("@/lib/admin", () => ({ requireAdminAccess: mocks.requireAdminAccess }));
vi.mock("@/lib/marketing/diaspora/service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/marketing/diaspora/service")>();
  return { ...actual, generateDiasporaDraft: mocks.generateDiasporaDraft };
});

import { GET, POST } from "./route";

const url = "https://www.shoonaya.com/api/admin/marketing/diaspora";
const post = (body: unknown) => new NextRequest(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verifyAdminCookieAuth.mockResolvedValue(null);
  mocks.requireAdminAccess.mockResolvedValue({ username: "founder", supabase: { marker: "db" } });
});

describe("admins only", () => {
  it("GET and POST refuse a request with no admin cookie, before anything runs", async () => {
    mocks.verifyAdminCookieAuth.mockResolvedValue(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    expect((await GET(new NextRequest(url))).status).toBe(401);
    expect((await POST(post({}))).status).toBe(401);
    expect(mocks.requireAdminAccess).not.toHaveBeenCalled();
    expect(mocks.generateDiasporaDraft).not.toHaveBeenCalled();
  });

  it("refuses a signed-in user who is not an admin", async () => {
    mocks.requireAdminAccess.mockResolvedValue({ response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) });
    expect((await POST(post({}))).status).toBe(403);
    expect(mocks.generateDiasporaDraft).not.toHaveBeenCalled();
  });
});

describe("GET", () => {
  it("returns the form options and every claim with its status, never cached", async () => {
    const response = await GET(new NextRequest(url));
    const body = await response.json();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(body.pillars.length).toBeGreaterThanOrEqual(8);
    expect(body.regions.map((r: { id: string }) => r.id)).toContain("uk");
    expect(body.channels).toEqual(["email", "whatsapp"]);
    expect(body.traditions).toEqual(["hindu", "sikh", "buddhist", "jain"]);
    expect(body.claims.filter((c: { status: string }) => c.status !== "confirmed").map((c: { id: string }) => c.id).sort()).toEqual(["ad_free", "kul_family_space", "mandali_community"]);
  });
});

describe("POST", () => {
  const ok = {
    ok: true,
    campaign: { id: "camp-1", campaign_key: "k", title: "T", status: "draft", created_by: "founder", secret_internal: "x" },
    variants: [{ id: "v1", channel: "email", subject: "S", body: "B", cta_text: "C", content_hash: "h", approved_manifest_hash: null }],
    attempts: { email: 1 }
  };

  it("passes the form through as the signed-in admin and returns only what the screen needs", async () => {
    mocks.generateDiasporaDraft.mockResolvedValue(ok);
    const response = await POST(post({ pillar_id: "a_small_daily_anchor", region_id: "uk", tradition: "sikh", channels: ["email"], occurrence_id: "occ-1" }));
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(mocks.generateDiasporaDraft).toHaveBeenCalledWith({ marker: "db" }, {
      pillarId: "a_small_daily_anchor", regionId: "uk", tradition: "sikh", channels: ["email"], occurrenceId: "occ-1", createdBy: "founder"
    });
    expect(body.campaign).toEqual({ id: "camp-1", campaign_key: "k", title: "T", status: "draft" });
    expect(body.variants[0]).toEqual({ id: "v1", channel: "email", subject: "S", body: "B", cta_text: "C" });
    expect(JSON.stringify(body)).not.toMatch(/secret_internal|content_hash|approved_manifest_hash/);
  });

  it("blank optional fields become null and a non-array channels becomes empty", async () => {
    mocks.generateDiasporaDraft.mockResolvedValue({ ok: false, reason: "invalid_channels" });
    await POST(post({ pillar_id: "a_small_daily_anchor", region_id: "uk", tradition: "  ", channels: "email", occurrence_id: "" }));
    expect(mocks.generateDiasporaDraft.mock.calls[0][1]).toMatchObject({ tradition: null, channels: [], occurrenceId: null });
  });

  it.each([
    ["invalid_pillar", 400], ["invalid_region", 400], ["invalid_tradition", 400], ["invalid_channels", 400],
    ["occasion_required", 400], ["occasion_not_publishable", 409], ["content_check_failed", 422],
    ["generation_failed", 502], ["empty_content", 502], ["campaign_creation_failed", 500], ["variant_save_failed", 500]
  ])("%s answers %i", async (reason, status) => {
    mocks.generateDiasporaDraft.mockResolvedValue({ ok: false, reason, detail: "why" });
    const response = await POST(post({ pillar_id: "x" }));
    expect(response.status).toBe(status);
    expect((await response.json()).error).toBe(reason);
  });

  it("a refused draft returns the rules it broke so the founder can see why", async () => {
    mocks.generateDiasporaDraft.mockResolvedValue({
      ok: false, reason: "content_check_failed", detail: "nothing was saved",
      violations: [{ channel: "email", rule: "statistic", excerpt: "10,000 families", message: "Do not state any number" }]
    });
    const body = await (await POST(post({ pillar_id: "x" }))).json();
    expect(body.violations).toEqual([{ channel: "email", rule: "statistic", excerpt: "10,000 families", message: "Do not state any number" }]);
  });

  it("an unexpected error is a generic 500 with no internal text, and a malformed body does not crash it", async () => {
    mocks.generateDiasporaDraft.mockRejectedValue(new Error("password authentication failed for user postgres"));
    const response = await POST(post({}));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toMatch(/password|postgres/);
    mocks.generateDiasporaDraft.mockResolvedValue({ ok: false, reason: "invalid_pillar" });
    const garbage = new NextRequest(url, { method: "POST", body: "{nope", headers: { "content-type": "application/json" } });
    expect((await POST(garbage)).status).toBe(400);
  });
});
