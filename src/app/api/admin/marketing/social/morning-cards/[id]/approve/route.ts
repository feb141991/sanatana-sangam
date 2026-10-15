import { NextRequest } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { noStoreJson } from "@/lib/marketing/social/morning/http";
import { approveCard, MorningCardError } from "@/lib/marketing/social/morning/service";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;
  try {
    const card = await approveCard(admin.supabase, id, admin.username);
    return noStoreJson({ card });
  } catch (error) {
    if (error instanceof MorningCardError) return noStoreJson({ error: error.message }, error.status);
    return noStoreJson({ error: "morning_card_approval_failed" }, 500);
  }
}
