import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";

/** Never returns access_token_enc/refresh_token_enc -- the accounts screen
 * shows connection health (status, expiry), not credentials. */
const SAFE_COLUMNS =
  "id, provider, account_type, external_account_id, display_name, token_expires_at, status, last_error, connected_by, connected_at, last_refreshed_at, last_verified_at, created_at, updated_at";

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const { data, error } = await admin.supabase.from("social_platform_accounts").select(SAFE_COLUMNS).order("provider").order("account_type");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ accounts: data ?? [] });
}

export async function DELETE(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const body = await request.json().catch(() => ({}));
  const accountId = body.account_id;
  if (!accountId) return NextResponse.json({ error: "account_id is required" }, { status: 400 });

  // Disconnect never deletes the row -- history (which posts used this
  // account) must stay intact. It marks the account revoked and clears the
  // encrypted tokens, so a stale credential can never be read or used again.
  const { error } = await admin.supabase
    .from("social_platform_accounts")
    .update({ status: "revoked", access_token_enc: null, refresh_token_enc: null })
    .eq("id", accountId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
