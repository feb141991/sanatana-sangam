import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";

const STATE_COOKIE = "social_linkedin_oauth_state";

// r_organization_social: read org page info. w_organization_social: publish
// as the organization. rw_organization_admin: list organizations this
// admin manages, needed to resolve which org URN to post as.
const SCOPES = ["r_organization_social", "w_organization_social", "rw_organization_admin"].join(" ");

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_OAUTH_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "LINKEDIN_CLIENT_ID / LINKEDIN_OAUTH_REDIRECT_URI not configured" }, { status: 500 });
  }

  const state = crypto.randomBytes(24).toString("hex");
  const authorizeUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("scope", SCOPES);

  const response = NextResponse.redirect(authorizeUrl.toString());
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/"
  });
  return response;
}
