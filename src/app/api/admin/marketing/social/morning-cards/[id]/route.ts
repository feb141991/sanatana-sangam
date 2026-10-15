import { NextRequest } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { noStoreJson } from "@/lib/marketing/social/morning/http";
import { MorningCardError, updateCaption } from "@/lib/marketing/social/morning/service";

export const runtime = "nodejs";

/** Edit the caption and hashtags. An approved card goes back to draft and must be approved again. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  try {
    const card = await updateCaption(admin.supabase, id, { caption: body?.caption, hashtags: body?.hashtags });
    return noStoreJson({ card });
  } catch (error) {
    if (error instanceof MorningCardError) return noStoreJson({ error: error.message }, error.status);
    return noStoreJson({ error: "morning_card_update_failed" }, 500);
  }
}
