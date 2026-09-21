import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { encryptSocialToken } from "@/lib/marketing/social/token-crypto";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const STATE_COOKIE = "social_meta_oauth_state";

interface PageRow {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string };
}

function errorRedirect(request: NextRequest, message: string) {
  const target = new URL("/admin/marketing/social/accounts", request.url);
  target.searchParams.set("error", message.slice(0, 300));
  const response = NextResponse.redirect(target);
  response.cookies.delete(STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return errorRedirect(request, "Invalid or missing OAuth state/code");
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_OAUTH_REDIRECT_URI;
  if (!appId || !appSecret || !redirectUri) {
    return errorRedirect(request, "Meta OAuth environment not configured");
  }

  // 1. Exchange the authorization code for a short-lived user token.
  const shortLivedUrl = new URL(`${GRAPH_API_BASE}/oauth/access_token`);
  shortLivedUrl.searchParams.set("client_id", appId);
  shortLivedUrl.searchParams.set("redirect_uri", redirectUri);
  shortLivedUrl.searchParams.set("client_secret", appSecret);
  shortLivedUrl.searchParams.set("code", code);

  const shortLivedRes = await fetch(shortLivedUrl.toString());
  const shortLivedPayload = (await shortLivedRes.json().catch(() => null)) as any;
  if (!shortLivedRes.ok || !shortLivedPayload?.access_token) {
    return errorRedirect(request, `Failed to exchange code: ${shortLivedPayload?.error?.message ?? shortLivedRes.status}`);
  }

  // 2. Exchange for a long-lived user token (~60 days) -- Page tokens minted
  // from a long-lived user token are effectively non-expiring as long as
  // the admin stays a Page admin, so this is what makes the connection
  // durable rather than needing a refresh flow on day one.
  const longLivedUrl = new URL(`${GRAPH_API_BASE}/oauth/access_token`);
  longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
  longLivedUrl.searchParams.set("client_id", appId);
  longLivedUrl.searchParams.set("client_secret", appSecret);
  longLivedUrl.searchParams.set("fb_exchange_token", shortLivedPayload.access_token);

  const longLivedRes = await fetch(longLivedUrl.toString());
  const longLivedPayload = (await longLivedRes.json().catch(() => null)) as any;
  if (!longLivedRes.ok || !longLivedPayload?.access_token) {
    return errorRedirect(request, `Failed to obtain long-lived token: ${longLivedPayload?.error?.message ?? longLivedRes.status}`);
  }
  const longLivedUserToken: string = longLivedPayload.access_token;

  // 3. List the Pages this admin manages, with each Page's own access token
  // and its linked Instagram Business Account, if any.
  const pagesUrl = new URL(`${GRAPH_API_BASE}/me/accounts`);
  pagesUrl.searchParams.set("fields", "id,name,access_token,instagram_business_account");
  pagesUrl.searchParams.set("access_token", longLivedUserToken);

  const pagesRes = await fetch(pagesUrl.toString());
  const pagesPayload = (await pagesRes.json().catch(() => null)) as any;
  if (!pagesRes.ok) {
    return errorRedirect(request, `Failed to list Pages: ${pagesPayload?.error?.message ?? pagesRes.status}`);
  }

  const pages: PageRow[] = pagesPayload?.data ?? [];
  const connected: Array<{ type: string; id: string; name: string }> = [];

  for (const page of pages) {
    const { encoded, keyVersion } = encryptSocialToken(page.access_token);
    const { error: pageUpsertError } = await admin.supabase
      .from("social_platform_accounts")
      .upsert(
        {
          provider: "meta",
          account_type: "facebook_page",
          external_account_id: page.id,
          display_name: page.name,
          access_token_enc: encoded,
          key_version: keyVersion,
          token_expires_at: null,
          scopes: [],
          status: "active",
          connected_by: admin.username,
          last_verified_at: new Date().toISOString()
        },
        { onConflict: "provider,account_type,external_account_id" }
      );
    if (!pageUpsertError) connected.push({ type: "facebook_page", id: page.id, name: page.name });

    if (page.instagram_business_account?.id) {
      const igId = page.instagram_business_account.id;
      const { encoded: igEncoded, keyVersion: igKeyVersion } = encryptSocialToken(page.access_token);
      const { error: igUpsertError } = await admin.supabase
        .from("social_platform_accounts")
        .upsert(
          {
            provider: "meta",
            account_type: "instagram_business",
            external_account_id: igId,
            display_name: `${page.name} (Instagram)`,
            access_token_enc: igEncoded,
            key_version: igKeyVersion,
            token_expires_at: null,
            scopes: [],
            status: "active",
            connected_by: admin.username,
            last_verified_at: new Date().toISOString()
          },
          { onConflict: "provider,account_type,external_account_id" }
        );
      if (!igUpsertError) connected.push({ type: "instagram_business", id: igId, name: `${page.name} (Instagram)` });
    }
  }

  const response = NextResponse.redirect(new URL("/admin/marketing/social/accounts?connected=meta", request.url));
  response.cookies.delete("social_meta_oauth_state");
  return response;
}
