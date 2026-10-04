import { NextRequest, NextResponse } from "next/server";

import { getApiAuthFailureResponse, getApiUser } from "@/lib/api-auth";
import { resolveNativeKulMembership } from "@/lib/native-kul";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  try {
    const membership = await resolveNativeKulMembership(supabase, user.id);
    if (!membership) return NextResponse.json(null, { headers: { "Cache-Control": "private, no-store" } });
    const wishes = await supabase.from("kul_tirtha_wishes")
      .select("place_id").eq("kul_id", membership.kulId)
      .order("place_id", { ascending: true }).limit(200);
    if (wishes.error) throw new Error("KUL membership summary lookup failed");
    return NextResponse.json({
      kulId: membership.kulId,
      role: membership.role,
      wishPlaceIds: (wishes.data ?? []).map((wish) => wish.place_id),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[native-kul] membership summary failed", { userId: user.id, requestId: request.headers.get("x-request-id"), error });
    return NextResponse.json({ error: "Could not check family membership. Please retry." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
