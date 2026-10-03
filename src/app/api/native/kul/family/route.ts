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
