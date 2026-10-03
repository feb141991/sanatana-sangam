import type { SupabaseClient } from "@supabase/supabase-js";

export type NativeKulMembership = {
  kulId: string;
  role: "guardian" | "sadhak";
};

type ProfileKulRow = { kul_id: string | null };
type MemberKulRow = { kul_id: string; role: "guardian" | "sadhak" };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function textField(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 && text.length <= maximum ? text : null;
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

/**
 * Resolve membership through the authenticated caller's RLS client. The
 * profile link is the canonical policy input; repair the existing link only
 * when an owned membership row proves the relationship.
 */
export async function resolveNativeKulMembership(
  supabase: SupabaseClient,
  userId: string,
): Promise<NativeKulMembership | null> {
  const profileResult = await supabase
    .from("profiles")
    .select("kul_id")
    .eq("id", userId)
    .maybeSingle();
  if (profileResult.error) throw new Error("KUL profile lookup failed");

  let kulId = (profileResult.data as ProfileKulRow | null)?.kul_id ?? null;
  if (!kulId) {
    const membershipResult = await supabase
      .from("kul_members")
      .select("kul_id")
      .eq("user_id", userId)
      .limit(2);
    if (membershipResult.error) throw new Error("KUL membership lookup failed");
    const memberships = (membershipResult.data ?? []) as Array<{
      kul_id: string;
    }>;
    if (memberships.length > 1) throw new Error("KUL membership is ambiguous");
    kulId = memberships[0]?.kul_id ?? null;
    if (!kulId) return null;

    const repairResult = await supabase.rpc("repair_kul_membership");
    if (repairResult.error) throw new Error("KUL membership repair failed");

    const repairedProfile = await supabase
      .from("profiles")
      .select("kul_id")
      .eq("id", userId)
      .maybeSingle();
    if (
      repairedProfile.error ||
      (repairedProfile.data as ProfileKulRow | null)?.kul_id !== kulId
    ) {
      throw new Error("KUL membership could not be confirmed");
    }
  }

  const roleResult = await supabase
    .from("kul_members")
    .select("kul_id, role")
    .eq("kul_id", kulId)
    .eq("user_id", userId)
    .maybeSingle();
  if (roleResult.error) throw new Error("KUL role lookup failed");
  const membership = roleResult.data as MemberKulRow | null;
  if (!membership || membership.kul_id !== kulId) {
    throw new Error("KUL membership link is inconsistent");
  }
  return { kulId, role: membership.role };
}
