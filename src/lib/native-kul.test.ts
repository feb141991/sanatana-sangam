import { describe, expect, it } from "vitest";

import { isIsoDate, resolveNativeKulMembership, textField } from "./native-kul";

function makeSupabase(input: {
  profile: { kul_id: string | null } | null;
  memberships: Array<{ kul_id: string }>;
  role?: { kul_id: string; role: "guardian" | "sadhak" } | null;
  repairError?: Error | null;
}) {
  const calls: string[] = [];
  const supabase = {
    from(table: string) {
      calls.push(table);
      const query = {
        select: () => query,
        eq: () => query,
        limit: async () => ({ data: input.memberships, error: null }),
        maybeSingle: async () => ({
          data: table === "profiles" ? input.profile : (input.role ?? null),
          error: null,
        }),
      };
      return query;
    },
    rpc: async () => ({ data: null, error: input.repairError ?? null }),
  };
  return { supabase: supabase as never, calls };
}

describe("Native KUL contract helpers", () => {
  it("trims bounded user text and rejects blank or oversized input", () => {
    expect(textField("  Family  ", 20)).toBe("Family");
    expect(textField("   ", 20)).toBeNull();
    expect(textField("long name", 4)).toBeNull();
    expect(textField(42, 20)).toBeNull();
  });

  it("accepts only real ISO calendar dates", () => {
    expect(isIsoDate("2026-10-03")).toBe(true);
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("2026-1-01")).toBe(false);
  });

  it("returns no membership without querying another users data", async () => {
    const { supabase, calls } = makeSupabase({
      profile: { kul_id: null },
      memberships: [],
    });
    await expect(
      resolveNativeKulMembership(supabase, "user-1"),
    ).resolves.toBeNull();
    expect(calls).toEqual(["profiles", "kul_members"]);
  });

  it("repairs a missing profile link only from the authenticated users own membership", async () => {
    let profileReads = 0;
    let repairCalls = 0;
    const supabase = {
      from(table: string) {
        const query = {
          select: () => query,
          eq: () => query,
          limit: async () => ({ data: [{ kul_id: "kul-owned" }], error: null }),
          maybeSingle: async () => {
            if (table === "profiles") {
              profileReads += 1;
              return {
                data:
                  profileReads === 1
                    ? { kul_id: null }
                    : { kul_id: "kul-owned" },
                error: null,
              };
            }
            return {
              data: { kul_id: "kul-owned", role: "sadhak" },
              error: null,
            };
          },
        };
        return query;
      },
      rpc: async () => {
        repairCalls += 1;
        return { data: null, error: null };
      },
    };

    await expect(
      resolveNativeKulMembership(supabase as never, "user-1"),
    ).resolves.toEqual({ kulId: "kul-owned", role: "sadhak" });
    expect(profileReads).toBe(2);
    expect(repairCalls).toBe(1);
  });

  it("fails closed when multiple owned KUL memberships make repair ambiguous", async () => {
    const { supabase } = makeSupabase({
      profile: { kul_id: null },
      memberships: [{ kul_id: "kul-a" }, { kul_id: "kul-b" }],
    });
    await expect(
      resolveNativeKulMembership(supabase, "user-1"),
    ).rejects.toThrow("ambiguous");
  });
});
