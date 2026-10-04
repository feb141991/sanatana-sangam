import { NextRequest, NextResponse } from "next/server";

import { getApiAuthFailureResponse, getApiUser } from "@/lib/api-auth";
import {
  isRecord,
  resolveNativeKulMembership,
  textField,
} from "@/lib/native-kul";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  const body: unknown = await request.json().catch(() => null);
  const memberId = isRecord(body) && typeof body.memberId === "string" && UUID_RE.test(body.memberId)
    ? body.memberId
    : null;
  if (!memberId || !isRecord(body)) return NextResponse.json({ error: "Choose a valid family member." }, { status: 400 });

  const update: Record<string, string | number | boolean | null> = {};
  if ("name" in body) {
    const name = textField(body.name, 80);
    if (!name) return NextResponse.json({ error: "Add a family member name." }, { status: 400 });
    update.name = name;
  }
  if ("relationship" in body) {
    if (body.relationship !== null && typeof body.relationship !== "string") return NextResponse.json({ error: "Check the relationship." }, { status: 400 });
    const relationship = body.relationship === null ? null : textField(body.relationship, 50);
    if (body.relationship !== null && !relationship) return NextResponse.json({ error: "Check the relationship." }, { status: 400 });
    update.role = relationship;
  }
  if ("generation" in body) {
    if (body.generation !== null && (!Number.isInteger(body.generation) || Number(body.generation) < 0 || Number(body.generation) > 20)) return NextResponse.json({ error: "Generation must be between 0 and 20." }, { status: 400 });
    update.generation = body.generation as number | null;
  }
  for (const [input, column] of [["parentId", "parent_id"], ["spouseId", "spouse_id"]] as const) {
    if (!(input in body)) continue;
    const value = body[input];
    if (value !== null && (typeof value !== "string" || !UUID_RE.test(value) || value === memberId)) return NextResponse.json({ error: "Choose another person in the family tree." }, { status: 400 });
    update[column] = value as string | null;
  }
  if ("isAlive" in body) {
    if (typeof body.isAlive !== "boolean") return NextResponse.json({ error: "Check the family member status." }, { status: 400 });
    update.is_alive = body.isAlive;
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "No family member changes were provided." }, { status: 400 });

  try {
    const membership = await resolveNativeKulMembership(supabase, user.id);
    if (!membership) return NextResponse.json({ error: "Join a family circle first." }, { status: 409 });
    if (membership.role !== "guardian") return NextResponse.json({ error: "Only a family guardian can edit the family tree." }, { status: 403 });
    for (const parentColumn of ["parent_id", "spouse_id"] as const) {
      const relatedId = update[parentColumn];
      if (typeof relatedId !== "string") continue;
      const related = await supabase.from("kul_family_members").select("id").eq("id", relatedId).eq("kul_id", membership.kulId).maybeSingle();
      if (related.error) throw new Error("KUL family relation validation failed");
      if (!related.data) return NextResponse.json({ error: "Choose a person already in this family tree." }, { status: 400 });
    }
    const { data, error } = await supabase.from("kul_family_members").update(update)
      .eq("id", memberId).eq("kul_id", membership.kulId)
      .select("id, name, role, generation, parent_id, spouse_id, is_alive").maybeSingle();
    if (error) throw new Error("KUL family member update failed");
    if (!data) return NextResponse.json({ error: "Family member not found." }, { status: 404 });
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[native-kul] family member update failed", { userId: user.id, requestId: request.headers.get("x-request-id"), error });
    return NextResponse.json({ error: "Could not update this family member. Please retry." }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  const body: unknown = await request.json().catch(() => null);
  const memberId = isRecord(body) && typeof body.memberId === "string" && UUID_RE.test(body.memberId) ? body.memberId : null;
  if (!memberId) return NextResponse.json({ error: "Choose a valid family member." }, { status: 400 });
  try {
    const membership = await resolveNativeKulMembership(supabase, user.id);
    if (!membership) return NextResponse.json({ error: "Join a family circle first." }, { status: 409 });
    if (membership.role !== "guardian") return NextResponse.json({ error: "Only a family guardian can remove family records." }, { status: 403 });
    const { data, error } = await supabase.from("kul_family_members").delete()
      .eq("id", memberId).eq("kul_id", membership.kulId).select("id").maybeSingle();
    if (error) throw new Error("KUL family member delete failed");
    if (!data) return NextResponse.json({ error: "Family member not found." }, { status: 404 });
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[native-kul] family member delete failed", { userId: user.id, requestId: request.headers.get("x-request-id"), error });
    return NextResponse.json({ error: "Could not remove this family member. Please retry." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body))
    return NextResponse.json(
      { error: "Invalid family member." },
      { status: 400 },
    );
  const name = textField(body.name, 80);
  const role =
    body.relationship == null || body.relationship === ""
      ? null
      : textField(body.relationship, 50);
  const generation = body.generation == null ? 1 : body.generation;
  const parentId =
    body.parentId == null || body.parentId === ""
      ? null
      : typeof body.parentId === "string" && UUID_RE.test(body.parentId)
        ? body.parentId
        : undefined;
  if (
    !name ||
    (generation !== null &&
      (!Number.isInteger(generation) ||
        (generation as number) < 0 ||
        (generation as number) > 20)) ||
    (body.relationship != null && body.relationship !== "" && !role) ||
    parentId === undefined
  ) {
    return NextResponse.json(
      { error: "Check the name, relationship, and generation." },
      { status: 400 },
    );
  }

  try {
    const membership = await resolveNativeKulMembership(supabase, user.id);
    if (!membership)
      return NextResponse.json(
        { error: "Join a family circle before adding family records." },
        { status: 409 },
      );
    if (membership.role !== "guardian")
      return NextResponse.json(
        { error: "Only a family guardian can edit the family tree." },
        { status: 403 },
      );
    if (parentId) {
      const parent = await supabase
        .from("kul_family_members")
        .select("id")
        .eq("id", parentId)
        .eq("kul_id", membership.kulId)
        .maybeSingle();
      if (parent.error) throw new Error("KUL family parent validation failed");
      if (!parent.data)
        return NextResponse.json(
          { error: "Choose a parent already in this family tree." },
          { status: 400 },
        );
    }

    const { data, error } = await supabase
      .from("kul_family_members")
      .insert({
        kul_id: membership.kulId,
        created_by: user.id,
        name,
        role,
        generation,
        parent_id: parentId,
        is_alive: true,
      })
      .select("id, name, role, generation, parent_id, spouse_id, is_alive")
      .single();
    if (error || !data)
      return NextResponse.json(
        { error: "Could not add this family member. Please retry." },
        { status: 503 },
      );
    return NextResponse.json(data, {
      status: 201,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[native-kul] family member creation failed", {
      userId: user.id,
      error,
    });
    return NextResponse.json(
      { error: "Could not add this family member. Please retry." },
      { status: 503 },
    );
  }
}
