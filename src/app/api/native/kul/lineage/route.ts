import { NextRequest, NextResponse } from "next/server";

import { getApiAuthFailureResponse, getApiUser } from "@/lib/api-auth";
import { validateKulCalendarTimezone } from "@/lib/native-kul-tithi";
import { isRecord, resolveNativeKulMembership, textField } from "@/lib/native-kul";

export const runtime = "nodejs";

type LineageField = {
  input: string;
  column: string;
  maximum: number;
};

const TEXT_FIELDS: LineageField[] = [
  { input: "gotra", column: "gotra", maximum: 120 },
  { input: "pravara", column: "pravara", maximum: 240 },
  { input: "kuldeviName", column: "kuldevi_name", maximum: 120 },
  { input: "kuldevtaName", column: "kuldevta_name", maximum: 120 },
  { input: "ancestralOrigin", column: "ancestral_origin", maximum: 160 },
  { input: "kulacharaNotes", column: "kulachara_notes", maximum: 2000 },
];

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body)) return fail("Invalid family lineage details.", 400);

  const update: Record<string, string | number | null> = {};
  for (const field of TEXT_FIELDS) {
    if (!(field.input in body)) continue;
    const raw = body[field.input];
    if (raw !== null && typeof raw !== "string") return fail("Check the family lineage details.", 400);
    const normalized = raw === null ? null : textField(raw, field.maximum);
    if (raw !== null && normalized === null) return fail("Check the family lineage details.", 400);
    update[field.column] = normalized;
  }

  for (const [input, column] of [["kuldeviPlaceId", "kuldevi_place_id"], ["kuldevtaPlaceId", "kuldevta_place_id"]] as const) {
    if (!(input in body)) continue;
    const raw = body[input];
    if (raw !== null && (typeof raw !== "string" || raw.length > 200)) return fail("Choose a valid Tirtha place.", 400);
    update[column] = raw as string | null;
  }

  const calendarFields: Array<[string, string]> = [
    ["calendarReferenceLabel", "calendar_reference_label"],
    ["calendarTimezone", "calendar_timezone"],
    ["calendarMonthSystem", "calendar_month_system"],
  ];
  for (const [input, column] of calendarFields) {
    if (!(input in body)) continue;
    const value = body[input];
    const maximum = input === "calendarTimezone" ? 80 : 100;
    if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > maximum) return fail("Check the family calendar settings.", 400);
    update[column] = value.trim();
  }
  for (const [input, column, minimum, maximum] of [
    ["calendarLatitude", "calendar_latitude", -90, 90],
    ["calendarLongitude", "calendar_longitude", -180, 180],
  ] as const) {
    if (!(input in body)) continue;
    const value = body[input];
    if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) return fail("Check the family calendar coordinates.", 400);
    update[column] = value;
  }

  if (Object.keys(update).length === 0) return fail("No family details were provided.", 400);
  if (("calendar_latitude" in update) !== ("calendar_longitude" in update)) {
    return fail("Set both calendar coordinates together.", 400);
  }
  if ("calendar_month_system" in update && update.calendar_month_system !== "amanta" && update.calendar_month_system !== "purnimanta") {
    return fail("Choose Amanta or Purnimanta month names.", 400);
  }
  if (typeof update.calendar_timezone === "string" && !validateKulCalendarTimezone(update.calendar_timezone)) {
    return fail("Choose a valid timezone.", 400);
  }

  try {
    const membership = await resolveNativeKulMembership(supabase, user.id);
    if (!membership) return fail("Join a family circle before editing lineage.", 409);
    if (membership.role !== "guardian") return fail("Only a family guardian can edit lineage.", 403);

    const placeIds = [update.kuldevi_place_id, update.kuldevta_place_id]
      .filter((value): value is string => typeof value === "string");
    if (placeIds.length) {
      const places = await supabase.from("tirtha_places").select("id").in("id", placeIds);
      if (places.error) throw new Error("KUL lineage place lookup failed");
      const found = new Set(((places.data ?? []) as Array<{ id: string }>).map((place) => place.id));
      if (placeIds.some((id) => !found.has(id))) return fail("Choose a sacred place from the Tirtha catalog.", 400);
    }

    const { data, error } = await supabase.from("kuls").update(update)
      .eq("id", membership.kulId).select("id, updated_at").maybeSingle();
    if (error) throw new Error("KUL lineage update failed");
    if (!data) return fail("Family circle not found.", 404);
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[native-kul] lineage update failed", {
      userId: user.id,
      requestId: request.headers.get("x-request-id"),
      error,
    });
    return fail("Could not save family lineage. Please retry.", 503);
  }
}
