import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

const mockVerifyAdminCookieAuth = vi.fn();
vi.mock("@/lib/admin-auth", () => ({
  verifyAdminCookieAuth: (...args: any[]) => mockVerifyAdminCookieAuth(...args),
}));

let mockUpsert = vi.fn();
let mockAdminClient = {
  from: vi.fn(() => ({
    upsert: (...args: any[]) => mockUpsert(...args),
  })),
};

vi.mock("@/lib/admin", () => ({
  requireAdminAccess: vi.fn().mockImplementation(async () => ({
    username: "admin_test",
    role: "super_admin",
    supabase: mockAdminClient,
  })),
}));

const mockGenerateWithProvider = vi.fn();
vi.mock("@/lib/ai/providers/inference", () => ({
  generateWithProvider: (...args: any[]) => mockGenerateWithProvider(...args),
}));

vi.mock("@/lib/monitoring/events", () => ({
  emitEvent: vi.fn(),
  emitError: vi.fn(),
}));

describe("POST /api/admin/generate-hindi-meanings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyAdminCookieAuth.mockResolvedValue(null);
    mockUpsert.mockResolvedValue({ error: null });
  });

  it("returns 400 if entries is empty or not an array", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/generate-hindi-meanings", {
      method: "POST",
      body: JSON.stringify({ entries: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("handles direct array response from LLM", async () => {
    mockGenerateWithProvider.mockResolvedValueOnce({
      text: JSON.stringify([{ id: "gita_1_1", meaning_hi: "धर्मक्षेत्र कुरुक्षेत्र में एकत्रित..." }]),
      provider: "sarvam",
      modelUsed: "sarvam-2b",
    });

    const req = new NextRequest("http://localhost:3000/api/admin/generate-hindi-meanings", {
      method: "POST",
      body: JSON.stringify({ entries: [{ id: "gita_1_1", meaning: "In the holy field of Kurukshetra..." }] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.saved).toBe(1);
    expect(json.results[0].meaning_hi).toContain("धर्मक्षेत्र");
    expect(mockUpsert).toHaveBeenCalledWith(
      [{ entry_id: "gita_1_1", meaning_hi: "धर्मक्षेत्र कुरुक्षेत्र में एकत्रित..." }],
      { onConflict: "entry_id" }
    );
  });

  it("handles object-wrapped array response from LLM (e.g. { results: [...] })", async () => {
    mockGenerateWithProvider.mockResolvedValueOnce({
      text: JSON.stringify({
        results: [{ id: "gita_1_2", meaning_hi: "राजा दुर्योधन ने देखा..." }],
      }),
      provider: "sarvam",
      modelUsed: "sarvam-2b",
    });

    const req = new NextRequest("http://localhost:3000/api/admin/generate-hindi-meanings", {
      method: "POST",
      body: JSON.stringify({ entries: [{ id: "gita_1_2", meaning: "King Duryodhana saw..." }] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.saved).toBe(1);
    expect(json.results[0].meaning_hi).toBe("राजा दुर्योधन ने देखा...");
  });

  it("handles markdown code fence wrapped JSON without throwing TypeError", async () => {
    mockGenerateWithProvider.mockResolvedValueOnce({
      text: "```json\n[{\"id\":\"gita_1_3\",\"meaning_hi\":\"हे आचार्य...\"}]\n```",
      provider: "sarvam",
      modelUsed: "sarvam-2b",
    });

    const req = new NextRequest("http://localhost:3000/api/admin/generate-hindi-meanings", {
      method: "POST",
      body: JSON.stringify({ entries: [{ id: "gita_1_3", meaning: "O teacher..." }] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.saved).toBe(1);
  });

  it("handles completely invalid non-array structure without unhandled TypeError: b.map is not a function", async () => {
    mockGenerateWithProvider.mockResolvedValueOnce({
      text: JSON.stringify({ message: "Sorry I cannot translate this" }),
      provider: "sarvam",
      modelUsed: "sarvam-2b",
    });

    const req = new NextRequest("http://localhost:3000/api/admin/generate-hindi-meanings", {
      method: "POST",
      body: JSON.stringify({ entries: [{ id: "gita_1_4", meaning: "Here are heroes..." }] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("Failed to generate or parse provider response");
  });
});
