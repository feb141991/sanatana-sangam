import { NextRequest } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { noStoreJson } from "@/lib/marketing/social/morning/http";
import { publishMorningCard, MorningCardError } from "@/lib/marketing/social/morning/service";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { accountId?: unknown };
  const accountId = typeof body?.accountId === "string" && body.accountId.trim() ? body.accountId.trim() : undefined;

  try {
    const { card, publishRecord } = await publishMorningCard(admin.supabase, id, {
      accountId,
      publishedBy: admin.username
    });
    return noStoreJson({ card, publishRecord });
  } catch (error) {
    if (error instanceof MorningCardError) return noStoreJson({ error: error.message }, error.status);
    return noStoreJson({ error: error instanceof Error ? error.message : "morning_card_publish_failed" }, 500);
  }
}
