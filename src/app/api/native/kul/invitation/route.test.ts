import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getApiUser = vi.fn();
const resolveNativeKulMembership = vi.fn();
const adminRpc = vi.fn();

vi.mock("@/lib/api-auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-auth")>()),
  getApiUser: (...args: unknown[]) => getApiUser(...args),
}));
vi.mock("@/lib/native-kul", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/native-kul")>()),
  resolveNativeKulMembership: (...args: unknown[]) => resolveNativeKulMembership(...args),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ rpc: adminRpc }),
}));

import { GET, POST } from "./route";

function request(method: "GET" | "POST", url: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe("Native KUL universal invitation route", () => {
  beforeEach(() => {
    getApiUser.mockReset();
    resolveNativeKulMembership.mockReset();
    adminRpc.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  });

  it("joins through the authenticated request client, never the service-role client", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { success: true, alreadyMember: false }, error: null });
    getApiUser.mockResolvedValue({ user: { id: "user-1" }, error: null, supabase: { rpc } });

    const response = await POST(request("POST", "https://www.shoonaya.com/api/native/kul/invitation", {
      action: "join_token",
      token: "a".repeat(48),
    }));

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("join_kul_invitation", { p_token: "a".repeat(48) });
    expect(adminRpc).not.toHaveBeenCalled();
  });

  it("requires guardian membership before returning or creating a share token", async () => {
    const rpc = vi.fn();
    getApiUser.mockResolvedValue({ user: { id: "user-1" }, error: null, supabase: { rpc } });
    resolveNativeKulMembership.mockResolvedValue({ kulId: "kul-1", role: "sadhak" });

    const response = await GET(request("GET", "https://www.shoonaya.com/api/native/kul/invitation"));

    expect(response.status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("previews a valid bearer token without exposing a database error", async () => {
    adminRpc.mockResolvedValue({
      data: { success: true, invitation: { kulName: "Sharma", avatarEmoji: "🪷", guardianName: "A", memberCount: 2, expiresAt: null } },
      error: null,
    });
    const token = "b".repeat(48);

    const response = await GET(request("GET", `https://www.shoonaya.com/api/native/kul/invitation?token=${token}`));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.invitation.kulName).toBe("Sharma");
    expect(payload.invitation.token).toBeUndefined();
  });

  it("rejects invalid regeneration limits before calling the database", async () => {
    const rpc = vi.fn();
    getApiUser.mockResolvedValue({ user: { id: "guardian-1" }, error: null, supabase: { rpc } });
    resolveNativeKulMembership.mockResolvedValue({ kulId: "kul-1", role: "guardian" });

    const response = await POST(request("POST", "https://www.shoonaya.com/api/native/kul/invitation", {
      action: "regenerate",
      maxUses: 0,
    }));

    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns a stable retryable diagnostic when preview configuration is unavailable", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const response = await GET(request(
      "GET",
      `https://www.shoonaya.com/api/native/kul/invitation?token=${"c".repeat(48)}`,
    ));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.code).toBe("KUL_INVITATION_BACKEND_UNAVAILABLE");
    expect(payload.requestId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(response.headers.get("x-request-id")).toBe(payload.requestId);
    expect(adminRpc).not.toHaveBeenCalled();
  });
});
