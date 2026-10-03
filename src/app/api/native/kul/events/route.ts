import { NextRequest, NextResponse } from "next/server";

import { getApiAuthFailureResponse, getApiUser } from "@/lib/api-auth";
import {
  isIsoDate,
  isRecord,
  resolveNativeKulMembership,
  textField,
} from "@/lib/native-kul";

export const runtime = "nodejs";

const EVENT_TYPES = new Set([
  "birthday",
  "anniversary",
  "death_anniversary",
  "puja",
  "satsang",
  "custom",
]);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body))
    return NextResponse.json(
      { error: "Invalid family date." },
      { status: 400 },
    );
  const title = textField(body.title, 100);
  const eventType =
    typeof body.eventType === "string" && EVENT_TYPES.has(body.eventType)
      ? body.eventType
      : null;
  const eventDate = isIsoDate(body.eventDate) ? body.eventDate : null;
  const description =
    body.description == null ? null : textField(body.description, 500);
  const memberId =
    body.memberId == null || body.memberId === ""
      ? null
      : typeof body.memberId === "string" && UUID_RE.test(body.memberId)
        ? body.memberId
        : undefined;
  const recurring = body.recurring;
  if (
    !title ||
    !eventType ||
    !eventDate ||
    typeof recurring !== "boolean" ||
    memberId === undefined ||
    (body.description != null && !description)
  ) {
    return NextResponse.json(
      { error: "Check the event name, date, and details." },
      { status: 400 },
    );
  }

  try {
    const membership = await resolveNativeKulMembership(supabase, user.id);
    if (!membership)
      return NextResponse.json(
        { error: "Join a family circle before adding dates." },
        { status: 409 },
      );
    if (membership.role !== "guardian")
      return NextResponse.json(
        { error: "Only a family guardian can add dates." },
        { status: 403 },
      );
    if (memberId) {
      const familyMember = await supabase
        .from("kul_family_members")
        .select("id")
        .eq("id", memberId)
        .eq("kul_id", membership.kulId)
        .maybeSingle();
      if (familyMember.error)
        throw new Error("KUL event member validation failed");
      if (!familyMember.data)
        return NextResponse.json(
          { error: "Choose a person in your family tree." },
          { status: 400 },
        );
    }

    const { data, error } = await supabase
      .from("kul_events")
      .insert({
        kul_id: membership.kulId,
        created_by: user.id,
        title,
        event_type: eventType,
        event_date: eventDate,
        description,
        member_id: memberId,
        recurring,
      })
      .select(
        "id, title, event_type, event_date, recurring, description, member_id",
      )
      .single();
    if (error || !data)
      return NextResponse.json(
        { error: "Could not add this family date. Please retry." },
        { status: 503 },
      );
    return NextResponse.json(data, {
      status: 201,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[native-kul] event creation failed", {
      userId: user.id,
      error,
    });
    return NextResponse.json(
      { error: "Could not add this family date. Please retry." },
      { status: 503 },
    );
  }
}
