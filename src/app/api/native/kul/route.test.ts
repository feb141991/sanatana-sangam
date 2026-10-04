import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const getApiUser = vi.fn();
vi.mock("@/lib/api-auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-auth")>()),
  getApiUser: (...args: unknown[]) => getApiUser(...args),
}));

import { GET, POST } from "./route";
import { POST as postMessage } from "./messages/route";
import { PATCH as patchTask, POST as postTask } from "./tasks/route";
import { POST as postEvent } from "./events/route";
import { POST as postFamilyMember } from "./family/route";

type DbResult = { data: unknown; error: Error | null };
type FakeQuery = {
  select: (columns?: string) => FakeQuery;
  eq: (column: string, value: string | boolean) => FakeQuery;
  in: (column: string, value: string[]) => FakeQuery;
  order: (column: string, options?: Record<string, unknown>) => FakeQuery;
  limit: (value: number) => FakeQuery;
  or: (filter: string) => FakeQuery;
  maybeSingle: () => Promise<DbResult>;
  single: () => Promise<DbResult>;
  insert: (value: Record<string, unknown>) => FakeQuery;
  update: (value: Record<string, unknown>) => FakeQuery;
  then: (
    resolve: (value: DbResult) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
};

function createSupabase(
  results: Record<string, DbResult[]>,
  rpcResult: DbResult = { data: { id: "kul-1" }, error: null },
) {
  const selections: Array<{ table: string; columns: string }> = [];
  const limits: Array<{ table: string; value: number }> = [];
  const filters: Array<{ table: string; value: string }> = [];
  const rpcCalls: Array<{ fn: string; args: Record<string, unknown> }> = [];
  const writes: Array<{
    table: string;
    kind: "insert" | "update";
    payload: Record<string, unknown>;
  }> = [];
  const indexes = new Map<string, number>();

  const supabase = {
    from(table: string) {
      const index = indexes.get(table) ?? 0;
      indexes.set(table, index + 1);
      const result = results[table]?.[index] ?? { data: [], error: null };
      let columns = "";
      const query: FakeQuery = {
        select(value = "*") {
          columns = value;
          selections.push({ table, columns });
          return query;
        },
        eq() {
          return query;
        },
        in() {
          return query;
        },
        order() {
          return query;
        },
        limit(value) {
          limits.push({ table, value });
          return query;
        },
        or(value) {
          filters.push({ table, value });
          return query;
        },
        maybeSingle: async () => result,
        single: async () => result,
        insert(value) {
          writes.push({ table, kind: "insert", payload: value });
          return query;
        },
        update(value) {
          writes.push({ table, kind: "update", payload: value });
          return query;
        },
        then: (resolve, reject) =>
          Promise.resolve(result).then(resolve, reject),
      };
      return query;
    },
    rpc: async (fn: string, args: Record<string, unknown>) => {
      rpcCalls.push({ fn, args });
      return rpcResult;
    },
  };
  return {
    supabase: supabase as unknown as SupabaseClient,
    selections,
    limits,
    filters,
    rpcCalls,
    writes,
  };
}

function request(url: string, method = "GET", body?: unknown) {
  return new NextRequest(url, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe("/api/native/kul", () => {
  beforeEach(() => getApiUser.mockReset());

  it("rejects unauthenticated requests using the shared auth classifier", async () => {
    getApiUser.mockResolvedValue({
      user: null,
      error: Object.assign(new Error("Unauthorized"), { status: 401 }),
      supabase: null,
    });
    const response = await GET(request("https://shoonaya.com/api/native/kul"));
    expect(response.status).toBe(401);
  });

  it("returns an explicit no-KUL snapshot without querying shared family data", async () => {
    const { supabase, selections } = createSupabase({
      profiles: [{ data: { kul_id: null }, error: null }],
      kul_members: [{ data: [], error: null }],
    });
    getApiUser.mockResolvedValue({
      user: { id: "user-1" },
      error: null,
      supabase,
    });

    const response = await GET(request("https://shoonaya.com/api/native/kul"));
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      userId: "user-1",
      kul: null,
      role: null,
      members: [],
      tasks: [],
      messages: [],
      familyMembers: [],
      events: [],
    });
    expect(selections.map((entry) => entry.table)).toEqual([
      "profiles",
      "kul_members",
    ]);
  });

  it("bounds every returned family collection and does not read practice history", async () => {
    // Keep the event-window assertion independent of the developer's local
    // timezone and the date on which this suite happens to run.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-03T12:00:00.000Z"));
    try {
      const { supabase, limits, filters, selections } = createSupabase({
        profiles: [
          { data: { kul_id: "kul-1" }, error: null },
          {
            data: [
              {
                id: "user-1",
                full_name: "Prince",
                username: "prince",
                avatar_url: null,
                tradition: "hindu",
                sampradaya: null,
              },
            ],
            error: null,
          },
        ],
        kul_members: [
          { data: { kul_id: "kul-1", role: "guardian" }, error: null },
          {
            data: [
              {
                id: "member-1",
                user_id: "user-1",
                role: "guardian",
                joined_at: "2026-10-01T00:00:00Z",
              },
            ],
            error: null,
          },
        ],
        kuls: [
          {
            data: {
              id: "kul-1",
              name: "Sharma Family",
              invite_code: "A1B2C3D4E5F6",
              avatar_emoji: "🏡",
              created_at: "2026-01-01T00:00:00Z",
            },
            error: null,
          },
        ],
        kul_tasks: [{ data: [], error: null }],
        kul_messages: [{ data: [], error: null }],
        kul_family_members: [{ data: [], error: null }],
        kul_events: [{ data: [], error: null }],
      });
      getApiUser.mockResolvedValue({
        user: { id: "user-1" },
        error: null,
        supabase,
      });

      const response = await GET(
        request("https://shoonaya.com/api/native/kul?today=2026-10-03"),
      );
      const json = await response.json();
      expect(response.status).toBe(200);
      expect(json.kul.inviteCode).toBe("A1B2C3D4E5F6");
      expect(json.members[0].profile.full_name).toBe("Prince");
      expect(limits).toEqual(
        expect.arrayContaining([
          { table: "kul_members", value: 6 },
          { table: "kul_tasks", value: 25 },
          { table: "kul_messages", value: 30 },
          { table: "kul_family_members", value: 100 },
          { table: "kul_events", value: 100 },
        ]),
      );
      expect(filters).toContainEqual({
        table: "kul_events",
        value:
          "event_date.gte.2026-10-03,recurring.eq.true,date_system.eq.tithi",
      });
      expect(
        selections.every(
          (entry) =>
            entry.table !== "daily_sadhana" && entry.table !== "mala_sessions",
        ),
      ).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("creates a circle through the authenticated RPC with a cryptographically generated invite code", async () => {
    const { supabase, rpcCalls, selections } = createSupabase({
      profiles: [{ data: { kul_id: null }, error: null }],
      kul_members: [{ data: [], error: null }],
    });
    getApiUser.mockResolvedValue({
      user: { id: "user-1" },
      error: null,
      supabase,
    });

    const response = await POST(
      request("https://shoonaya.com/api/native/kul", "POST", {
        action: "create",
        name: "Sharma Family",
        emoji: "🏡",
      }),
    );
    expect(response.status).toBe(201);
    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0].fn).toBe("create_kul");
    expect(rpcCalls[0].args.p_invite_code).toMatch(/^[A-F0-9]{12}$/);
    expect(selections).toHaveLength(0);
  });

  it("normalizes and validates invite codes before joining", async () => {
    const { supabase, rpcCalls, selections } = createSupabase({
      profiles: [{ data: { kul_id: null }, error: null }],
      kul_members: [{ data: [], error: null }],
    });
    getApiUser.mockResolvedValue({
      user: { id: "user-1" },
      error: null,
      supabase,
    });

    const response = await POST(
      request("https://shoonaya.com/api/native/kul", "POST", {
        action: "join",
        inviteCode: " ab12cd ",
      }),
    );
    expect(response.status).toBe(200);
    expect(rpcCalls).toEqual([
      { fn: "join_kul", args: { p_invite_code: "AB12CD" } },
    ]);
    expect(selections).toHaveLength(0);
  });

  it("rejects malformed join codes without invoking the database", async () => {
    const { supabase, rpcCalls } = createSupabase({});
    getApiUser.mockResolvedValue({
      user: { id: "user-1" },
      error: null,
      supabase,
    });
    const response = await POST(
      request("https://shoonaya.com/api/native/kul", "POST", {
        action: "join",
        inviteCode: "bad code!",
      }),
    );
    expect(response.status).toBe(400);
    expect(rpcCalls).toHaveLength(0);
  });

  it("rejects an empty Sabha message before membership or database writes", async () => {
    const { supabase, writes } = createSupabase({});
    getApiUser.mockResolvedValue({
      user: { id: "user-1" },
      error: null,
      supabase,
    });
    const response = await postMessage(
      request("https://shoonaya.com/api/native/kul/messages", "POST", {
        content: "   ",
      }),
    );
    expect(response.status).toBe(400);
    expect(writes).toHaveLength(0);
  });

  it("allows only a guardian to assign a task to a current family member", async () => {
    const assignedTo = "22222222-2222-4222-8222-222222222222";
    const { supabase, writes } = createSupabase({
      profiles: [{ data: { kul_id: "kul-1" }, error: null }],
      kul_members: [
        { data: { kul_id: "kul-1", role: "guardian" }, error: null },
        { data: { user_id: assignedTo }, error: null },
      ],
      kul_tasks: [
        {
          data: { id: "task-1", title: "Practice", completed: false },
          error: null,
        },
      ],
    });
    getApiUser.mockResolvedValue({
      user: { id: "user-1" },
      error: null,
      supabase,
    });
    const response = await postTask(
      request("https://shoonaya.com/api/native/kul/tasks", "POST", {
        title: "Practice together",
        taskType: "practice",
        assignedTo,
        dueDate: null,
      }),
    );
    expect(response.status).toBe(201);
    expect(writes).toEqual([
      expect.objectContaining({
        table: "kul_tasks",
        kind: "insert",
        payload: expect.objectContaining({
          kul_id: "kul-1",
          assigned_by: "user-1",
          assigned_to: assignedTo,
        }),
      }),
    ]);
  });

  it("blocks non-guardians from family dates and tree writes", async () => {
    for (const handler of [
      () =>
        postEvent(
          request("https://shoonaya.com/api/native/kul/events", "POST", {
            title: "Puja",
            eventType: "puja",
            eventDate: "2026-10-03",
            recurring: false,
          }),
        ),
      () =>
        postFamilyMember(
          request("https://shoonaya.com/api/native/kul/family", "POST", {
            name: "Aaji",
          }),
        ),
    ]) {
      const { supabase, writes } = createSupabase({
        profiles: [{ data: { kul_id: "kul-1" }, error: null }],
        kul_members: [
          { data: { kul_id: "kul-1", role: "sadhak" }, error: null },
        ],
      });
      getApiUser.mockResolvedValue({
        user: { id: "user-1" },
        error: null,
        supabase,
      });
      const response = await handler();
      expect(response.status).toBe(403);
      expect(writes).toHaveLength(0);
    }
  });

  it("requires a remembrance date to link to a deceased person in the same KUL", async () => {
    const memberId = "22222222-2222-4222-8222-222222222222";
    const { supabase, writes, selections } = createSupabase({
      profiles: [{ data: { kul_id: "kul-1" }, error: null }],
      kul_members: [
        { data: { kul_id: "kul-1", role: "guardian" }, error: null },
      ],
      kul_family_members: [
        { data: { id: memberId, is_alive: true }, error: null },
      ],
    });
    getApiUser.mockResolvedValue({
      user: { id: "user-1" },
      error: null,
      supabase,
    });
    const response = await postEvent(
      request("https://shoonaya.com/api/native/kul/events", "POST", {
        title: "Aaji's remembrance",
        eventType: "death_anniversary",
        eventDate: "2000-10-20",
        recurring: true,
        memberId,
      }),
    );
    expect(response.status).toBe(400);
    expect(selections).toContainEqual({
      table: "kul_family_members",
      columns: "id, is_alive",
    });
    expect(writes).toHaveLength(0);
  });

  it("rejects a one-time death-anniversary date before database access", async () => {
    const { supabase, selections, writes } = createSupabase({});
    getApiUser.mockResolvedValue({
      user: { id: "user-1" },
      error: null,
      supabase,
    });
    const response = await postEvent(
      request("https://shoonaya.com/api/native/kul/events", "POST", {
        title: "Remembrance",
        eventType: "death_anniversary",
        eventDate: "2000-10-20",
        recurring: false,
        memberId: "22222222-2222-4222-8222-222222222222",
      }),
    );
    expect(response.status).toBe(400);
    expect(selections).toHaveLength(0);
    expect(writes).toHaveLength(0);
  });

  it("prevents another family member from completing an assigned task", async () => {
    const { supabase, writes } = createSupabase({
      profiles: [{ data: { kul_id: "kul-1" }, error: null }],
      kul_members: [{ data: { kul_id: "kul-1", role: "sadhak" }, error: null }],
      kul_tasks: [
        {
          data: { id: "task-1", assigned_to: "other-user", completed: false },
          error: null,
        },
      ],
    });
    getApiUser.mockResolvedValue({
      user: { id: "user-1" },
      error: null,
      supabase,
    });
    const response = await patchTask(
      request("https://shoonaya.com/api/native/kul/tasks", "PATCH", {
        taskId: "11111111-1111-4111-8111-111111111111",
        completed: true,
      }),
    );
    expect(response.status).toBe(403);
    expect(writes).toHaveLength(0);
  });

  it("treats repeated task completion as idempotent", async () => {
    const { supabase, writes } = createSupabase({
      profiles: [{ data: { kul_id: "kul-1" }, error: null }],
      kul_members: [{ data: { kul_id: "kul-1", role: "sadhak" }, error: null }],
      kul_tasks: [
        {
          data: { id: "task-1", assigned_to: "user-1", completed: true },
          error: null,
        },
      ],
    });
    getApiUser.mockResolvedValue({
      user: { id: "user-1" },
      error: null,
      supabase,
    });
    const response = await patchTask(
      request("https://shoonaya.com/api/native/kul/tasks", "PATCH", {
        taskId: "11111111-1111-4111-8111-111111111111",
        completed: true,
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: "task-1",
      completed: true,
      alreadyCompleted: true,
    });
    expect(writes).toHaveLength(0);
  });
});
