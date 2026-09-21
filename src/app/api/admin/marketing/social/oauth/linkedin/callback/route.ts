import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";
import { encryptSocialToken } from "@/lib/marketing/social/token-crypto";

const STATE_COOKIE = "social_linkedin_oauth_state";
const LINKEDIN_API_VERSION = "202501"; // kept in sync with src/lib/marketing/social/publishers/linkedin.ts

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

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return errorRedirect(request, "LinkedIn OAuth environment not configured");
  }

  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret
    }).toString()
  });
  const tokenPayload = (await tokenRes.json().catch(() => null)) as any;
  if (!tokenRes.ok || !tokenPayload?.access_token) {
    return errorRedirect(request, `Failed to exchange code: ${tokenPayload?.error_description ?? tokenRes.status}`);
  }

  const accessToken: string = tokenPayload.access_token;
  const expiresInSeconds: number = tokenPayload.expires_in ?? 60 * 24 * 3600; // LinkedIn default: ~60 days
  const tokenExpiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  // LinkedIn only issues a refresh_token when the app has been granted
  // "Programmatic Refresh Token" access; most apps must re-run this OAuth
  // flow before expiry instead. Connection-health UI (accounts screen)
  // surfaces token_expires_at so an admin can reconnect in time.
  const refreshToken: string | null = tokenPayload.refresh_token ?? null;

  const aclsUrl = new URL("https://api.linkedin.com/rest/organizationAcls");
  aclsUrl.searchParams.set("q", "roleAssignee");
  aclsUrl.searchParams.set("role", "ADMINISTRATOR");
  aclsUrl.searchParams.set("state", "APPROVED");

  const aclsRes = await fetch(aclsUrl.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "LinkedIn-Version": LINKEDIN_API_VERSION,
      "X-Restli-Protocol-Version": "2.0.0"
    }
  });
  const aclsPayload = (await aclsRes.json().catch(() => null)) as any;
  if (!aclsRes.ok) {
    return errorRedirect(request, `Failed to list organizations: ${aclsPayload?.message ?? aclsRes.status}`);
  }

  const elements: Array<{ organization: string }> = aclsPayload?.elements ?? [];
  let connectedCount = 0;

  for (const el of elements) {
    // el.organization is a URN like "urn:li:organization:12345678".
    const orgId = el.organization.split(":").pop();
    if (!orgId) continue;

    const orgRes = await fetch(`https://api.linkedin.com/rest/organizations/${orgId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": LINKEDIN_API_VERSION,
        "X-Restli-Protocol-Version": "2.0.0"
      }
    });
    const orgPayload = (await orgRes.json().catch(() => null)) as any;
    const orgName: string = orgPayload?.localizedName ?? `Organization ${orgId}`;

    const { encoded, keyVersion } = encryptSocialToken(accessToken);
    const { error: upsertError } = await admin.supabase
      .from("social_platform_accounts")
      .upsert(
        {
          provider: "linkedin",
          account_type: "linkedin_organization",
          external_account_id: orgId,
          display_name: orgName,
          access_token_enc: encoded,
          refresh_token_enc: refreshToken ? encryptSocialToken(refreshToken).encoded : null,
          key_version: keyVersion,
          token_expires_at: tokenExpiresAt,
          scopes: [],
          status: "active",
          connected_by: admin.username,
          last_verified_at: new Date().toISOString()
        },
        { onConflict: "provider,account_type,external_account_id" }
      );
    if (!upsertError) connectedCount++;
  }

  if (connectedCount === 0) {
    return errorRedirect(request, "Connected to LinkedIn, but no administered organization pages were found");
  }

  const response = NextResponse.redirect(new URL("/admin/marketing/social/accounts?connected=linkedin", request.url));
  response.cookies.delete(STATE_COOKIE);
  return response;
}
