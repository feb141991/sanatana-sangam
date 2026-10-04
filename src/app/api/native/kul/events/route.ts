import { NextRequest, NextResponse } from "next/server";

import { getApiAuthFailureResponse, getApiUser } from "@/lib/api-auth";
import {
  getKulLocalDate,
  resolveKulRecurringGregorianDate,
  resolveNextKulTithiDates,
  type KulTithiRequest,
  validateKulCalendarTimezone,
} from "@/lib/native-kul-tithi";
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

type EventInput = {
  title: string;
  eventType: string;
  dateSystem: "gregorian" | "tithi";
  eventDate: string | null;
  description: string | null;
  memberId: string | null;
  recurring: boolean;
  tithiRequest: KulTithiRequest | null;
};

function fail(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

function parseEventInput(body: unknown): EventInput | null {
  if (!isRecord(body)) return null;
  const title = textField(body.title, 100);
  const eventType = typeof body.eventType === "string" && EVENT_TYPES.has(body.eventType)
    ? body.eventType
    : null;
  const dateSystem = body.dateSystem === "tithi" ? "tithi" : body.dateSystem === "gregorian" || body.dateSystem == null ? "gregorian" : null;
  const eventDate = dateSystem === "gregorian"
    ? (isIsoDate(body.eventDate) ? body.eventDate : null)
    : null;
  const description = body.description == null ? null : textField(body.description, 500);
  const memberId = body.memberId == null || body.memberId === ""
    ? null
    : typeof body.memberId === "string" && UUID_RE.test(body.memberId)
      ? body.memberId
      : undefined;
  const recurring = body.recurring;
  let tithiRequest: KulTithiRequest | null = null;
  if (dateSystem === "tithi") {
    const masa = body.masa;
    const tithi = body.tithi;
    const paksha = body.paksha;
    const monthSystem = body.monthSystem;
    const masaIsAdhika = body.masaIsAdhika ?? false;
    if (
      !Number.isInteger(masa) || Number(masa) < 1 || Number(masa) > 12 ||
      !Number.isInteger(tithi) || Number(tithi) < 1 || Number(tithi) > 15 ||
      (paksha !== "shukla" && paksha !== "krishna") ||
      (monthSystem !== "amanta" && monthSystem !== "purnimanta") ||
      typeof masaIsAdhika !== "boolean" || recurring !== true
    ) return null;
    tithiRequest = { masa: Number(masa), tithi: Number(tithi), paksha, monthSystem, masaIsAdhika };
  }
  if (
    !title || !eventType || !dateSystem ||
    (dateSystem === "gregorian" && !eventDate) ||
    (dateSystem === "tithi" && !tithiRequest) ||
    typeof recurring !== "boolean" ||
    memberId === undefined ||
    (body.description != null && !description) ||
    (eventType === "death_anniversary" && (memberId === null || recurring !== true))
  ) return null;
  return { title, eventType, dateSystem, eventDate, description, memberId, recurring, tithiRequest };
}

async function handleEventWrite(request: NextRequest, method: "POST" | "PATCH") {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  const body: unknown = await request.json().catch(() => null);
  const input = parseEventInput(body);
  const eventId = method === "PATCH" && isRecord(body) && typeof body.eventId === "string" && UUID_RE.test(body.eventId)
    ? body.eventId
    : null;
  if (!input || (method === "PATCH" && !eventId))
    return fail("Check the family date details and calendar date type.", 400);

  try {
    const membership = await resolveNativeKulMembership(supabase, user.id);
    if (!membership) return fail("Join a family circle before editing dates.", 409);
    if (membership.role !== "guardian") return fail("Only a family guardian can manage family dates.", 403);

    if (input.memberId) {
      const member = await supabase.from("kul_family_members").select("id, is_alive")
        .eq("id", input.memberId).eq("kul_id", membership.kulId).maybeSingle();
      if (member.error) throw new Error("KUL event member validation failed");
      if (!member.data) return fail("Choose a person already in this family tree.", 400);
      if (input.eventType === "death_anniversary" && member.data.is_alive !== false) {
        return fail("A family remembrance date must link to someone marked deceased.", 400);
      }
    }

    const calendarResult = await supabase.from("kuls")
      .select("calendar_latitude, calendar_longitude, calendar_reference_label, calendar_timezone")
      .eq("id", membership.kulId).maybeSingle();
    const calendar = calendarResult.data as {
      calendar_latitude: number;
      calendar_longitude: number;
      calendar_reference_label: string;
      calendar_timezone: string;
    } | null;
    if (calendarResult.error || !calendar || !validateKulCalendarTimezone(calendar.calendar_timezone))
      throw new Error("KUL calendar settings could not be resolved");
    const today = getKulLocalDate(new Date(), calendar.calendar_timezone);
    let eventDate = input.eventDate;
    let resolvedCivilDate: string | null = null;
    let tithiLabel: string | null = null;
    let calculationLocation: string | null = null;
    if (input.tithiRequest) {
      const resolution = resolveNextKulTithiDates(
        [input.tithiRequest],
        today,
        { lat: calendar.calendar_latitude, lon: calendar.calendar_longitude, tz: calendar.calendar_timezone },
      ).values().next().value;
      if (!resolution?.civilDate) return fail("This tithi could not be resolved for the next 400 days. Check the family calendar reference.", 422);
      eventDate = resolution.civilDate;
      resolvedCivilDate = resolution.civilDate;
      tithiLabel = resolution.tithiLabel;
      calculationLocation = calendar.calendar_reference_label;
    }
    const resolvedDisplayDate = input.tithiRequest
      ? resolvedCivilDate
      : eventDate
        ? resolveKulRecurringGregorianDate(eventDate, today, input.recurring)
        : null;

    const values = {
      title: input.title,
      event_type: input.eventType,
      event_date: eventDate,
      recurring: input.recurring,
      description: input.description,
      member_id: input.memberId,
      date_system: input.dateSystem,
      masa: input.tithiRequest?.masa ?? null,
      paksha: input.tithiRequest?.paksha ?? null,
      tithi: input.tithiRequest?.tithi ?? null,
      month_system: input.tithiRequest?.monthSystem ?? null,
      masa_is_adhika: input.tithiRequest?.masaIsAdhika ?? false,
      tithi_resolution: "sunrise",
    };

    const query = method === "POST"
      ? supabase.from("kul_events").insert({ ...values, kul_id: membership.kulId, created_by: user.id })
      : supabase.from("kul_events").update(values).eq("id", eventId ?? "").eq("kul_id", membership.kulId);
    const { data, error } = await query.select(
      "id, title, event_type, event_date, recurring, description, member_id, date_system, masa, paksha, tithi, month_system, masa_is_adhika, tithi_resolution",
    ).maybeSingle();
    if (error) {
      if (error.code === "PGRST116") return fail("Family date not found.", 404);
      throw new Error("KUL event write failed");
    }
    if (!data) return fail("Family date not found.", 404);
    return NextResponse.json({
      ...data,
      resolved_civil_date: resolvedDisplayDate,
      tithi_label: tithiLabel,
      calculation_location: calculationLocation,
    }, {
      status: method === "POST" ? 201 : 200,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[native-kul] family event write failed", {
      userId: user.id,
      requestId: request.headers.get("x-request-id"),
      operation: method.toLowerCase(),
      error,
    });
    return fail("Could not save this family date. Please retry.", 503);
  }
}

export async function POST(request: NextRequest) {
  return handleEventWrite(request, "POST");
}

export async function PATCH(request: NextRequest) {
  return handleEventWrite(request, "PATCH");
}

export async function DELETE(request: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  const body: unknown = await request.json().catch(() => null);
  const eventId = isRecord(body) && typeof body.eventId === "string" && UUID_RE.test(body.eventId)
    ? body.eventId
    : null;
  if (!eventId) return fail("Choose a valid family date.", 400);
  try {
    const membership = await resolveNativeKulMembership(supabase, user.id);
    if (!membership) return fail("Join a family circle first.", 409);
    if (membership.role !== "guardian") return fail("Only a family guardian can delete dates.", 403);
    const { data, error } = await supabase.from("kul_events").delete()
      .eq("id", eventId).eq("kul_id", membership.kulId).select("id").maybeSingle();
    if (error) throw new Error("KUL event delete failed");
    if (!data) return fail("Family date not found.", 404);
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[native-kul] family event delete failed", {
      userId: user.id,
      requestId: request.headers.get("x-request-id"),
      error,
    });
    return fail("Could not delete this family date. Please retry.", 503);
  }
}
