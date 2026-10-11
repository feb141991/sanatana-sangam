import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  verifyAdminCookieAuth: vi.fn(),
  requireAdminAccess: vi.fn(),
  encryptSocialToken: vi.fn(),
  fetchMetaPages: vi.fn(),
  fetchInstagramUsername: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ verifyAdminCookieAuth: mocks.verifyAdminCookieAuth }));
vi.mock("@/lib/admin", () => ({ requireAdminAccess: mocks.requireAdminAccess }));
vi.mock("@/lib/marketing/social/token-crypto", () => ({
  encryptSocialToken: mocks.encryptSocialToken,
}));
vi.mock("@/lib/marketing/social/manual-meta-connect", () => ({
  fetchMetaPages: mocks.fetchMetaPages,
  fetchInstagramUsername: mocks.fetchInstagramUsername,
}));

import { POST } from "./route";

function request(token: unknown) {
  return new NextRequest("https://www.shoonaya.com/api/admin/marketing/social/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

describe("manual social-account connection route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyAdminCookieAuth.mockResolvedValue(null);
    mocks.encryptSocialToken.mockReturnValue({ encoded: "encrypted", keyVersion: 3 });
    mocks.fetchInstagramUsername.mockResolvedValue("shoonaya");
  });

  it("rejects a malformed token before calling Meta", async () => {
    mocks.requireAdminAccess.mockResolvedValue({ username: "admin", supabase: {} });
    const response = await POST(request(null));
    expect(response.status).toBe(400);
    expect(mocks.fetchMetaPages).not.toHaveBeenCalled();
  });

  it("persists Facebook and Instagram destinations in one atomic upsert", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upsert });
    mocks.requireAdminAccess.mockResolvedValue({ username: "admin", supabase: { from } });
    mocks.fetchMetaPages.mockResolvedValue([{
      id: "page-1",
      name: "Shoonaya",
      accessToken: "page-token",
      instagramBusinessAccountId: "ig-1",
    }]);

    const response = await POST(request("user-token"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(from).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledTimes(1);
    const rows = upsert.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(2);
    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ account_type: "facebook_page", key_version: 3, access_token_enc: "encrypted" }),
      expect.objectContaining({ account_type: "instagram_business", key_version: 3, display_name: "@shoonaya" }),
    ]));
    expect(payload.connected).toHaveLength(2);
  });

  it("does not claim success when the atomic database write fails", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: "sensitive database detail" } });
    mocks.requireAdminAccess.mockResolvedValue({
      username: "admin",
      supabase: { from: vi.fn().mockReturnValue({ upsert }) },
    });
    mocks.fetchMetaPages.mockResolvedValue([{
      id: "page-1",
      name: "Shoonaya",
      accessToken: "page-token",
      instagramBusinessAccountId: null,
    }]);

    const response = await POST(request("user-token"));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("Could not securely save the Meta account connection.");
    expect(JSON.stringify(payload)).not.toContain("sensitive database detail");
  });
});
