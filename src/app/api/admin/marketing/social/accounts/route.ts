import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { encryptSocialToken } from "@/lib/marketing/social/token-crypto";
import { fetchInstagramUsername, fetchMetaPages } from "@/lib/marketing/social/manual-meta-connect";

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

export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const body: unknown = await request.json().catch(() => null);
  const token = typeof body === "object" && body !== null && "token" in body && typeof body.token === "string"
    ? body.token.trim()
    : "";
  if (!token || token.length > 4096) {
    return NextResponse.json({ error: "Access token is required" }, { status: 400 });
  }

  try {
    const pages = await fetchMetaPages(token);
    if (!pages) {
      return NextResponse.json(
        { error: "Meta rejected this token or returned an invalid response. Check its Page permissions and try again." },
        { status: 400 }
      );
    }
    if (pages.length === 0) {
      return NextResponse.json(
        { error: "Token is valid, but no Facebook Pages were found for this user account." },
        { status: 400 }
      );
    }

    const connected: Array<{ type: string; id: string; name: string }> = [];
    const rows: Array<Record<string, unknown>> = [];

    for (const page of pages) {
      const { encoded: pageEnc, keyVersion } = encryptSocialToken(page.accessToken);
      const now = new Date().toISOString();
      rows.push({
        provider: "meta",
        account_type: "facebook_page",
        external_account_id: page.id,
        display_name: page.name,
        access_token_enc: pageEnc,
        key_version: keyVersion,
        token_expires_at: null,
        scopes: [],
        status: "active",
        connected_by: admin.username,
        connected_at: now,
        last_verified_at: now,
        updated_at: now,
      });
      connected.push({ type: "facebook_page", id: page.id, name: page.name });

      if (page.instagramBusinessAccountId) {
        const igId = page.instagramBusinessAccountId;
        let igName = `${page.name} Instagram`;
        try {
          const username = await fetchInstagramUsername(igId, page.accessToken);
          if (username) igName = `@${username}`;
        } catch {
          // Account connection remains valid when the optional display-name lookup fails.
        }

        rows.push({
          provider: "meta",
          account_type: "instagram_business",
          external_account_id: igId,
          display_name: igName,
          access_token_enc: pageEnc,
          key_version: keyVersion,
          token_expires_at: null,
          scopes: [],
          status: "active",
          connected_by: admin.username,
          connected_at: now,
          last_verified_at: now,
          updated_at: now,
        });
        connected.push({ type: "instagram_business", id: igId, name: igName });
      }
    }

    // A single multi-row upsert keeps the connection atomic: a database error
    // cannot leave Facebook connected while its paired Instagram account is not.
    const { error: writeError } = await admin.supabase
      .from("social_platform_accounts")
      .upsert(rows, { onConflict: "provider,account_type,external_account_id" });
    if (writeError) throw new Error("social_account_write_failed");

    return NextResponse.json({ success: true, connected });
  } catch (error: unknown) {
    const code = error instanceof Error && error.message === "social_account_write_failed"
      ? "social_account_write_failed"
      : "social_account_connection_failed";
    console.error("[marketing.social.accounts] manual Meta connection failed", { code });
    return NextResponse.json({ error: "Could not securely save the Meta account connection." }, { status: 500 });
  }
}
