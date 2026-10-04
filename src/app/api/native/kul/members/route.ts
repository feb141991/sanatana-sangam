import { NextRequest, NextResponse } from "next/server";

import { getApiAuthFailureResponse, getApiUser } from "@/lib/api-auth";
import { isRecord, resolveNativeKulMembership } from "@/lib/native-kul";

export const runtime = "nodejs";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  const body: unknown = await request.json().catch(() => null);
  const targetUserId = isRecord(body) && typeof body.targetUserId === "string" && UUID_RE.test(body.targetUserId)
    ? body.targetUserId
    : null;
  if (!targetUserId) return fail("Choose a valid family member.", 400);
  try {
    const membership = await resolveNativeKulMembership(supabase, user.id);
    if (!membership) return fail("Join a family circle first.", 409);
    if (membership.role !== "guardian") return fail("Only a family guardian can transfer guardianship.", 403);
    const { error } = await supabase.rpc("transfer_kul_guardian", { p_target_user_id: targetUserId });
    if (error) {
      if (error.message.includes("Choose another")) return fail("Choose another current family member.", 400);
      return fail("Could not transfer guardianship. Please retry.", 409);
    }
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[native-kul] guardian transfer failed", { userId: user.id, requestId: request.headers.get("x-request-id"), error });
    return fail("Could not transfer guardianship. Please retry.", 503);
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  const body: unknown = await request.json().catch(() => null);
  const targetUserId = isRecord(body) && typeof body.targetUserId === "string" && UUID_RE.test(body.targetUserId)
    ? body.targetUserId
    : null;
  if (!targetUserId) return fail("Choose a valid family member.", 400);
  try {
    const membership = await resolveNativeKulMembership(supabase, user.id);
    if (!membership) return fail("Join a family circle first.", 409);

    if (targetUserId === user.id) {
      const { error } = await supabase.rpc("leave_kul");
      if (error) return fail("Could not leave this family circle. Please retry.", 409);
      return NextResponse.json({ success: true, deletedLastMember: false }, { headers: { "Cache-Control": "private, no-store" } });
    }
    if (membership.role !== "guardian") return fail("Only a family guardian can remove another member.", 403);
    const { error } = await supabase.rpc("remove_kul_member", { p_target_user_id: targetUserId });
    if (error) {
      if (error.message.includes("Transfer guardianship")) return fail("Transfer guardianship before removing that guardian.", 409);
      if (error.message.includes("not found")) return fail("Family member not found.", 404);
      return fail("Could not remove this family member. Please retry.", 409);
    }
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[native-kul] member removal or leave failed", { userId: user.id, requestId: request.headers.get("x-request-id"), error });
    return fail("Could not update family membership. Please retry.", 503);
  }
}
