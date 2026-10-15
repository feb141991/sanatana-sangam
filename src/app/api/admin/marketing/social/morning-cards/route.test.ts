import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  verifyAdminCookieAuth: vi.fn(),
  requireAdminAccess: vi.fn(),
  generateMorningSet: vi.fn(),
  listMorningCards: vi.fn(),
  updateCaption: vi.fn(),
  approveCard: vi.fn(),
  rejectCard: vi.fn()
}));

vi.mock("@/lib/admin-auth", () => ({ verifyAdminCookieAuth: mocks.verifyAdminCookieAuth }));
vi.mock("@/lib/admin", () => ({ requireAdminAccess: mocks.requireAdminAccess }));
vi.mock("@/lib/marketing/social/morning/service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/marketing/social/morning/service")>();
  return {
    ...actual,
    generateMorningSet: mocks.generateMorningSet,
    listMorningCards: mocks.listMorningCards,
    updateCaption: mocks.updateCaption,
    approveCard: mocks.approveCard,
    rejectCard: mocks.rejectCard
  };
});

import { GET, POST } from "./route";
import { PATCH } from "./[id]/route";
import { POST as APPROVE } from "./[id]/approve/route";
import { POST as REJECT } from "./[id]/reject/route";
import { MORNING_TIMEZONE, MorningCardError, todayIn } from "@/lib/marketing/social/morning/service";

const url = "https://www.shoonaya.com/api/admin/marketing/social/morning-cards";
const get = (query = "") => new NextRequest(`${url}${query}`);
const post = (body: unknown) => new NextRequest(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const idRequest = (method: string, body?: unknown) =>
  new NextRequest(`${url}/c-1`, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
const ctx = { params: Promise.resolve({ id: "c-1" }) };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verifyAdminCookieAuth.mockResolvedValue(null);
  mocks.requireAdminAccess.mockResolvedValue({ username: "founder", supabase: { marker: "db" } });
  mocks.listMorningCards.mockResolvedValue([]);
  mocks.generateMorningSet.mockResolvedValue([]);
});

describe("every route is for admins only and never reaches the database without that", () => {
  const rejected = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const calls: Array<[string, () => Promise<Response>]> = [
    ["GET", () => GET(get())],
    ["POST", () => POST(post({}))],
    ["PATCH", () => PATCH(idRequest("PATCH", { caption: "x", hashtags: [] }), ctx)],
    ["approve", () => APPROVE(idRequest("POST"), ctx)],
    ["reject", () => REJECT(idRequest("POST"), ctx)]
  ];

  it.each(calls)("%s refuses a request with no admin cookie", async (_name, call) => {
    mocks.verifyAdminCookieAuth.mockResolvedValue(rejected);
    const response = await call();
    expect(response.status).toBe(401);
    expect(mocks.requireAdminAccess).not.toHaveBeenCalled();
    for (const fn of [mocks.generateMorningSet, mocks.listMorningCards, mocks.updateCaption, mocks.approveCard, mocks.rejectCard]) {
      expect(fn).not.toHaveBeenCalled();
    }
  });

  it.each(calls)("%s refuses a signed-in user who is not an admin", async (_name, call) => {
    mocks.requireAdminAccess.mockResolvedValue({ response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) });
    expect((await call()).status).toBe(403);
    for (const fn of [mocks.generateMorningSet, mocks.listMorningCards, mocks.updateCaption, mocks.approveCard, mocks.rejectCard]) {
      expect(fn).not.toHaveBeenCalled();
    }
  });
});

describe("GET", () => {
  it("returns today's cards (in India) and the art prompts, never cached", async () => {
    mocks.listMorningCards.mockResolvedValue([{ id: "c-1", image_url: "https://signed.example/x" }]);
    const response = await GET(get());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(body.date).toBe(todayIn(MORNING_TIMEZONE));
    expect(body.cards).toHaveLength(1);
    expect(body.artPrompts.map((p: { tradition: string }) => p.tradition)).toEqual(["hindu", "sikh", "buddhist", "jain"]);
    expect(mocks.listMorningCards).toHaveBeenCalledWith({ marker: "db" }, body.date);
  });

  it("refuses an impossible or out-of-range date before touching the database", async () => {
    for (const bad of ["2026-02-31", "yesterday", "2020-01-01", "2099-01-01"]) {
      const response = await GET(get(`?date=${bad}`));
      expect(response.status, bad).toBe(400);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
    }
    expect(mocks.listMorningCards).not.toHaveBeenCalled();
  });

  it("does not leak internal error text", async () => {
    mocks.listMorningCards.mockRejectedValue(new Error("relation social_morning_cards does not exist"));
    const response = await GET(get());
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toMatch(/relation|does not exist/);
  });
});

describe("POST (the one click)", () => {
  it("generates for today by default as the signed-in admin, and returns what happened", async () => {
    mocks.generateMorningSet.mockResolvedValue([{ tradition: "hindu", result: "created", cardId: "c-1" }]);
    const response = await POST(post({}));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(mocks.generateMorningSet).toHaveBeenCalledWith({ marker: "db" }, { date: todayIn(MORNING_TIMEZONE), createdBy: "founder", regenerate: false });
    expect(body.outcomes).toEqual([{ tradition: "hindu", result: "created", cardId: "c-1" }]);
  });

  it("passes a chosen date and an explicit regenerate", async () => {
    await POST(post({ date: todayIn(MORNING_TIMEZONE), regenerate: true }));
    expect(mocks.generateMorningSet).toHaveBeenCalledWith({ marker: "db" }, expect.objectContaining({ regenerate: true }));
  });

  it("only an actual true counts as regenerate", async () => {
    await POST(post({ regenerate: "true" }));
    expect(mocks.generateMorningSet).toHaveBeenCalledWith({ marker: "db" }, expect.objectContaining({ regenerate: false }));
  });

  it("refuses an impossible date and a malformed body does not crash it", async () => {
    expect((await POST(post({ date: "2026-02-31" }))).status).toBe(400);
    expect(mocks.generateMorningSet).not.toHaveBeenCalled();
    const garbage = new NextRequest(url, { method: "POST", body: "{not json", headers: { "content-type": "application/json" } });
    expect((await POST(garbage)).status).toBe(200);
  });
});

describe("PATCH / approve / reject", () => {
  it("PATCH passes the caption and hashtags through", async () => {
    mocks.updateCaption.mockResolvedValue({ id: "c-1" });
    const response = await PATCH(idRequest("PATCH", { caption: "Hello", hashtags: ["A"] }), ctx);
    expect(response.status).toBe(200);
    expect(mocks.updateCaption).toHaveBeenCalledWith({ marker: "db" }, "c-1", { caption: "Hello", hashtags: ["A"] });
  });

  it("approve records the signed-in admin as the approver", async () => {
    mocks.approveCard.mockResolvedValue({ id: "c-1", status: "approved" });
    const response = await APPROVE(idRequest("POST"), ctx);
    expect(response.status).toBe(200);
    expect(mocks.approveCard).toHaveBeenCalledWith({ marker: "db" }, "c-1", "founder");
  });

  it("reject records the signed-in admin", async () => {
    mocks.rejectCard.mockResolvedValue({ id: "c-1", status: "rejected" });
    expect((await REJECT(idRequest("POST"), ctx)).status).toBe(200);
    expect(mocks.rejectCard).toHaveBeenCalledWith({ marker: "db" }, "c-1", "founder");
  });

  it("a rule the service enforces comes back with its own status and message", async () => {
    mocks.approveCard.mockRejectedValue(new MorningCardError(409, "Only a draft can be approved"));
    const response = await APPROVE(idRequest("POST"), ctx);
    expect(response.status).toBe(409);
    expect((await response.json()).error).toBe("Only a draft can be approved");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("anything unexpected is a generic 500, never the internal message", async () => {
    for (const [call, mock] of [
      [() => PATCH(idRequest("PATCH", { caption: "x", hashtags: [] }), ctx), mocks.updateCaption],
      [() => APPROVE(idRequest("POST"), ctx), mocks.approveCard],
      [() => REJECT(idRequest("POST"), ctx), mocks.rejectCard]
    ] as const) {
      mock.mockRejectedValue(new Error("password authentication failed for user postgres"));
      const response = await call();
      expect(response.status).toBe(500);
      expect(JSON.stringify(await response.json())).not.toMatch(/password|postgres/);
    }
  });
});
