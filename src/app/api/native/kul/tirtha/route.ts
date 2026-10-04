import { NextRequest, NextResponse } from "next/server";

import { getApiAuthFailureResponse, getApiUser } from "@/lib/api-auth";
import { getKulLocalDate } from "@/lib/native-kul-tithi";
import { isRecord, resolveNativeKulMembership, textField } from "@/lib/native-kul";

export const runtime = "nodejs";
const PLACE_ID_RE = /^(?:curated:[a-z0-9_-]+|osm:(?:node|way|relation):\d+|overpass:\d+)$/i;
const TRADITIONS = new Set(["hindu", "sikh", "buddhist", "jain", "other"]);

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "private, no-store" } });
}

type KulTirthaPlace = {
  id: string;
  name: string;
  tradition: string;
  deity: string | null;
  address: string | null;
  lat: number;
  lon: number;
};

type KulTirthaWishRow = {
  id: string;
  place_id: string;
  status: "wishlist" | "visited";
  visited_at: string | null;
  notes: string | null;
  created_at: string;
  place: KulTirthaPlace | KulTirthaPlace[] | null;
};

function normalizeWish(row: KulTirthaWishRow) {
  const place = Array.isArray(row.place) ? row.place[0] : row.place;
  return {
    id: row.id,
    placeId: row.place_id,
    name: place?.name ?? "Sacred place",
    tradition: place?.tradition ?? "other",
    deity: place?.deity ?? null,
    address: place?.address ?? null,
    latitude: place?.lat ?? 0,
    longitude: place?.lon ?? 0,
    status: row.status,
    visitedAt: row.visited_at,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

async function getWish(supabase: NonNullable<Awaited<ReturnType<typeof getApiUser>>["supabase"]>, kulId: string, placeId: string) {
  return supabase.from("kul_tirtha_wishes")
    .select("id, place_id, status, visited_at, notes, created_at, place:tirtha_places(id, name, tradition, deity, address, lat, lon)")
    .eq("kul_id", kulId).eq("place_id", placeId).maybeSingle();
}

export async function GET(request: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 80) return NextResponse.json({ places: [] }, { headers: { "Cache-Control": "private, no-store" } });
  try {
    const membership = await resolveNativeKulMembership(supabase, user.id);
    if (!membership) return fail("Join a family circle before searching family pilgrimage places.", 409);
    const escapedQuery = query.replace(/[\\%_,()]/g, " ").replace(/\s+/g, " ").trim();
    if (escapedQuery.length < 2) return NextResponse.json({ places: [] }, { headers: { "Cache-Control": "private, no-store" } });
    const { data, error } = await supabase.from("tirtha_places")
      .select("id, name, tradition, deity, address, lat, lon")
      .ilike("name", `%${escapedQuery}%`)
      .order("name", { ascending: true }).limit(20);
    if (error) throw new Error("KUL Tirtha search failed");
    return NextResponse.json({ places: (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      tradition: TRADITIONS.has(row.tradition) ? row.tradition : "other",
      deity: row.deity,
      address: row.address,
      latitude: row.lat,
      longitude: row.lon,
    })) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[native-kul] Tirtha search failed", { userId: user.id, requestId: request.headers.get("x-request-id"), error });
    return fail("Could not search sacred places. Please retry.", 503);
  }
}

export async function POST(request: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  const body: unknown = await request.json().catch(() => null);
  const placeId = isRecord(body) && typeof body.placeId === "string" && PLACE_ID_RE.test(body.placeId) ? body.placeId : null;
  if (!placeId) return fail("Choose a sacred place from the Tirtha catalog.", 400);
  try {
    const membership = await resolveNativeKulMembership(supabase, user.id);
    if (!membership) return fail("Join a family circle before adding pilgrimage places.", 409);
    const place = await supabase.from("tirtha_places").select("id").eq("id", placeId).maybeSingle();
    if (place.error) throw new Error("KUL Tirtha place lookup failed");
    if (!place.data) return fail("This sacred place is no longer in the Tirtha catalog.", 404);

    const inserted = await supabase.from("kul_tirtha_wishes").insert({
      kul_id: membership.kulId,
      place_id: placeId,
      added_by: user.id,
      status: "wishlist",
    }).select("id, place_id, status, visited_at, notes, created_at, place:tirtha_places(id, name, tradition, deity, address, lat, lon)").maybeSingle();
    if (inserted.error?.code === "23505") {
      const existing = await getWish(supabase, membership.kulId, placeId);
      if (existing.error || !existing.data) throw new Error("Existing KUL Tirtha wish could not be loaded");
      return NextResponse.json({ ...normalizeWish(existing.data), alreadyExists: true }, { headers: { "Cache-Control": "private, no-store" } });
    }
    if (inserted.error || !inserted.data) throw new Error("KUL Tirtha wish insert failed");
    return NextResponse.json(normalizeWish(inserted.data), { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[native-kul] Tirtha wish add failed", { userId: user.id, requestId: request.headers.get("x-request-id"), error });
    return fail("Could not add this place to your family Yatra. Please retry.", 503);
  }
}

export async function PATCH(request: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body)) return fail("Check the family pilgrimage update.", 400);
  const placeId = typeof body.placeId === "string" && PLACE_ID_RE.test(body.placeId) ? body.placeId : null;
  const status = body.status === "wishlist" || body.status === "visited" ? body.status : null;
  const notes = body.notes === undefined ? undefined : body.notes === null ? null : textField(body.notes, 500);
  if (!placeId || !status || (body.notes !== undefined && body.notes !== null && notes === null)) return fail("Check the family pilgrimage update.", 400);
  try {
    const membership = await resolveNativeKulMembership(supabase, user.id);
    if (!membership) return fail("Join a family circle first.", 409);
    const calendarResult = await supabase.from("kuls").select("calendar_timezone").eq("id", membership.kulId).maybeSingle();
    if (calendarResult.error || !calendarResult.data) throw new Error("KUL calendar timezone lookup failed");
    const values: { status: "wishlist" | "visited"; visited_at: string | null; notes?: string | null; updated_at: string } = {
      status,
      visited_at: status === "visited" ? getKulLocalDate(new Date(), calendarResult.data.calendar_timezone) : null,
      updated_at: new Date().toISOString(),
    };
    if (notes !== undefined) values.notes = notes;
    const { data, error } = await supabase.from("kul_tirtha_wishes").update(values)
      .eq("kul_id", membership.kulId).eq("place_id", placeId)
      .select("id, place_id, status, visited_at, notes, created_at, place:tirtha_places(id, name, tradition, deity, address, lat, lon)")
      .maybeSingle();
    if (error) throw new Error("KUL Tirtha wish update failed");
    if (!data) return fail("This place is no longer on the family list.", 404);
    return NextResponse.json(normalizeWish(data), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[native-kul] Tirtha wish update failed", { userId: user.id, requestId: request.headers.get("x-request-id"), error });
    return fail("Could not update this family pilgrimage place. Please retry.", 503);
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  const body: unknown = await request.json().catch(() => null);
  const placeId = isRecord(body) && typeof body.placeId === "string" && PLACE_ID_RE.test(body.placeId) ? body.placeId : null;
  if (!placeId) return fail("Choose a valid family pilgrimage place.", 400);
  try {
    const membership = await resolveNativeKulMembership(supabase, user.id);
    if (!membership) return fail("Join a family circle first.", 409);
    const { data, error } = await supabase.from("kul_tirtha_wishes").delete()
      .eq("kul_id", membership.kulId).eq("place_id", placeId).select("id").maybeSingle();
    if (error) throw new Error("KUL Tirtha wish delete failed");
    if (!data) return fail("This place is no longer on the family list.", 404);
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[native-kul] Tirtha wish delete failed", { userId: user.id, requestId: request.headers.get("x-request-id"), error });
    return fail("Could not remove this family pilgrimage place. Please retry.", 503);
  }
}
