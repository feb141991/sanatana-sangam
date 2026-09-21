import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { requireAdminAccess } from "@/lib/admin";

const GRAPH_API_VERSION = "v21.0";
const STATE_COOKIE = "social_meta_oauth_state";

// pages_manage_posts + pages_read_engagement + pages_show_list: manage the
// connected Facebook Page. instagram_basic + instagram_content_publish:
// publish to the Page's linked Instagram Business account. business_management
// is required to list Pages managed via a Business Manager.
const SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
  "business_management"
].join(",");

export async function GET(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;
  const admin = await requireAdminAccess(request);
  if ("response" in admin) return admin.response;

  const appId = process.env.META_APP_ID;
  const redirectUri = process.env.META_OAUTH_REDIRECT_URI;
  if (!appId || !redirectUri) {
    return NextResponse.json({ error: "META_APP_ID / META_OAUTH_REDIRECT_URI not configured" }, { status: 500 });
  }

  const state = crypto.randomBytes(24).toString("hex");
  const authorizeUrl = new URL(`https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth`);
  authorizeUrl.searchParams.set("client_id", appId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("scope", SCOPES);
  authorizeUrl.searchParams.set("response_type", "code");

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
