import { NextRequest, NextResponse } from "next/server";

import { getApiAuthFailureResponse, getApiUser } from "@/lib/api-auth";

export const runtime = "nodejs";
const PLACE_ID_RE = /^(?:curated:[a-z0-9_-]+|osm:(?:node|way|relation):\d+|overpass:\d+)$/i;

export async function GET(request: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  const placeId = request.nextUrl.searchParams.get("placeId") ?? "";
  if (!PLACE_ID_RE.test(placeId)) return NextResponse.json({ error: "Choose a valid Tirtha place." }, { status: 400 });
  try {
    const { data, error } = await supabase.from("tirtha_places")
      .select("id, name, tradition, deity, address, lat, lon, website, phone, opening_hours, sampradaya")
      .eq("id", placeId).maybeSingle();
    if (error) throw new Error("Tirtha catalog lookup failed");
    if (!data) return NextResponse.json({ error: "This place is not in the Tirtha catalog." }, { status: 404 });
    const traditions = new Set(["hindu", "sikh", "buddhist", "jain", "other"]);
    return NextResponse.json({
      placeId: data.id,
      temple: {
        id: data.id,
        name: data.name,
        tradition: traditions.has(data.tradition) ? data.tradition : "other",
        deity: data.deity ?? undefined,
        address: data.address ?? undefined,
        lat: data.lat,
        lon: data.lon,
        website: data.website ?? undefined,
        phone: data.phone ?? undefined,
        opening: data.opening_hours ?? undefined,
        sampradaya: data.sampradaya ?? undefined,
      },
    }, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch (error) {
    console.error("[native-tirtha] place lookup failed", { userId: user.id, placeId, requestId: request.headers.get("x-request-id"), error });
    return NextResponse.json({ error: "Could not open this sacred place. Please retry." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
