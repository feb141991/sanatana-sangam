import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

const getApiUser = vi.fn();
vi.mock("@/lib/api-auth", () => ({ getApiUser: (...a: unknown[]) => getApiUser(...a) }));
vi.mock("@/lib/api-guards", () => ({ assertNotBanned: async () => null }));

type Row = { id: string; user_id: string; client_operation_id: string | null };

describe("POST /api/mood/checkin -- idempotency", () => {
  let rows: Row[];
  let insertCount: number;
  let nextId: number;
  let forceUniqueViolationOnce: boolean;

  const mockSupabase = {
    from: (table: string) => {
      if (table !== "user_mood_checkins") return {};
      return {
        select: (_cols: string) => ({
          eq: (col1: string, val1: string) => ({
            eq: (col2: string, val2: string) => ({
              maybeSingle: async () => {
                const match = rows.find((r) => (r as any)[col1] === val1 && (r as any)[col2] === val2);
                return { data: match ?? null, error: null };
              },
            }),
          }),
        }),
        update: (_payload: Record<string, unknown>) => ({
          eq: () => ({
            eq: async () => ({ data: null, error: null }),
          }),
        }),
        insert: (payload: Record<string, unknown>) => ({
          select: (_cols: string) => ({
            single: async () => {
              insertCount += 1;
              if (forceUniqueViolationOnce) {
                forceUniqueViolationOnce = false;
                return { data: null, error: { code: "23505", message: "duplicate key" } };
              }
              const id = `checkin-${nextId++}`;
              rows.push({ id, user_id: payload.user_id as string, client_operation_id: (payload.client_operation_id as string) ?? null });
              return { data: { id }, error: null };
            },
          }),
        }),
      };
    },
  };

  beforeEach(() => {
    getApiUser.mockReset();
    getApiUser.mockResolvedValue({ user: { id: "user-1" }, error: null, supabase: mockSupabase });
    rows = [];
    insertCount = 0;
    nextId = 1;
    forceUniqueViolationOnce = false;
  });

  function req(body: Record<string, unknown>) {
    return new NextRequest("http://localhost:3000/api/mood/checkin", { method: "POST", body: JSON.stringify(body) });
  }

  it("inserts once for a fresh client_operation_id", async () => {
    const res = await POST(req({ before_mood: "joyful", client_operation_id: "11111111-1111-1111-1111-111111111111" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.checkin_id).toBe("checkin-1");
    expect(json.idempotentReplay).toBeUndefined();
    expect(insertCount).toBe(1);
  });

  it("a retry with the same client_operation_id returns the existing row instead of inserting again", async () => {
    const opId = "22222222-2222-2222-2222-222222222222";
    const first = await POST(req({ before_mood: "calm", client_operation_id: opId }));
    const firstJson = await first.json();

    const retry = await POST(req({ before_mood: "calm", client_operation_id: opId }));
    const retryJson = await retry.json();

    expect(retry.status).toBe(200);
    expect(retryJson.checkin_id).toBe(firstJson.checkin_id);
    expect(retryJson.idempotentReplay).toBe(true);
    expect(insertCount, "The second POST must not create a second row").toBe(1);
  });

  it("a concurrent race that hits the unique constraint still returns the existing row, not a 500", async () => {
    const opId = "33333333-3333-3333-3333-333333333333";
    // Simulate: another in-flight request already inserted this exact
    // operation id between this request's own lookup and its insert.
    rows.push({ id: "checkin-raced", user_id: "user-1", client_operation_id: opId });
    forceUniqueViolationOnce = false; // lookup will find it before insert is attempted
    const res = await POST(req({ before_mood: "anxious", client_operation_id: opId }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.checkin_id).toBe("checkin-raced");
    expect(json.idempotentReplay).toBe(true);
  });

  it("still works with no client_operation_id at all (backward compatible, e.g. web)", async () => {
    const res = await POST(req({ before_mood: "grateful" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.checkin_id).toBe("checkin-1");
    expect(insertCount).toBe(1);
  });

  it("rejects a non-UUID client_operation_id", async () => {
    const res = await POST(req({ before_mood: "joyful", client_operation_id: "not-a-uuid" }));
    expect(res.status).toBe(400);
    expect(insertCount).toBe(0);
  });
});
