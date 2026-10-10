import { randomBytes, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { getApiAuthFailureResponse, getApiUser } from "@/lib/api-auth";
import { resolveNativeKulMembership, textField } from "@/lib/native-kul";

export const runtime = "nodejs";

function fail(error: string, status = 400, details?: { code: string; requestId: string }) {
  return NextResponse.json(
    { error, ...(details ?? {}) },
    { status, headers: { "Cache-Control": "private, no-store", ...(details ? { "X-Request-ID": details.requestId } : {}) } },
  );
}

function requestIdFor(request: NextRequest) {
  const candidate = request.headers.get("x-request-id");
  return candidate && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate)
    ? candidate
    : randomUUID();
}

function dependencyFailure(request: NextRequest, stage: string, cause: unknown, startedAt: number) {
  const requestId = requestIdFor(request);
  const providerCode = typeof cause === "object" && cause !== null && "code" in cause &&
    typeof cause.code === "string" && /^[A-Za-z0-9_-]{1,32}$/.test(cause.code) ? cause.code : "unknown";
  console.error("[native-kul-invitation] dependency failed", {
    stage,
    providerCode,
    durationMs: Math.round(performance.now() - startedAt),
    requestId,
  });
  return fail("Family invitations are temporarily unavailable. Please retry.", 503, {
    code: "KUL_INVITATION_BACKEND_UNAVAILABLE",
    requestId,
  });
}

function freshToken() {
  return randomBytes(24).toString("hex");
}

function invitationArgs(
  action: "get_or_create" | "regenerate" | "revoke",
  options: { maxUses?: number | null; expiresAt?: string | null } = {},
) {
  return {
    p_action: action,
    p_max_uses: options.maxUses ?? null,
    p_expires_at: options.expiresAt ?? null,
    p_token: action === "revoke" ? null : freshToken(),
  };
}

// A token is a bearer secret. Preview deliberately requires possession of the
// complete token but not an account, so recipients can inspect before sign-in.
export async function GET(request: NextRequest) {
  const startedAt = performance.now();
  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (token) {
    if (!/^[0-9a-f]{32,64}$/.test(token)) return fail("Invalid family invitation.", 404);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return dependencyFailure(request, "preview_config", { code: "missing_config" }, startedAt);
    }
    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await admin.rpc("preview_kul_invitation", { p_token: token });
    if (error) return dependencyFailure(request, "preview_rpc", error, startedAt);
    if (!data || !(data as { success?: boolean }).success) {
      return fail("This family invitation is no longer available.", 404);
    }
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  }

  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  let membership;
  try {
    membership = await resolveNativeKulMembership(supabase, user.id);
  } catch (error) {
    return dependencyFailure(request, "membership_resolution", error, startedAt);
  }
  if (!membership) return fail("You are not a member of a family circle.", 404);
  if (membership.role !== "guardian") return fail("Only family guardians can share invitation links.", 403);

  const { data, error } = await supabase.rpc(
    "manage_kul_invitation",
    invitationArgs("get_or_create"),
  );
  if (error) return dependencyFailure(request, "manage_get_or_create_rpc", error, startedAt);
  if (!data || !(data as { success?: boolean }).success) {
    return fail("Could not prepare the family invitation link.", 503);
  }
  return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const startedAt = performance.now();
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail("Invalid JSON payload.");
  const input = body as Record<string, unknown>;
  const action = typeof input.action === "string" ? input.action : "";

  if (action === "join_token") {
    const token = textField(input.token, 64);
    if (!token || !/^[0-9a-f]{32,64}$/.test(token)) return fail("Invalid family invitation.");
    const { data, error } = await supabase.rpc("join_kul_invitation", { p_token: token });
    if (error) return dependencyFailure(request, "join_rpc", error, startedAt);
    if (!data || !(data as { success?: boolean }).success) {
      return fail("That family invitation could not be joined. It may have expired or reached its limit.");
    }
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  }

  let membership;
  try {
    membership = await resolveNativeKulMembership(supabase, user.id);
  } catch (error) {
    return dependencyFailure(request, "membership_resolution", error, startedAt);
  }
  if (!membership || membership.role !== "guardian") {
    return fail("Only family guardians can manage invitation links.", 403);
  }

  if (action === "revoke") {
    const { data, error } = await supabase.rpc("manage_kul_invitation", invitationArgs("revoke"));
    if (error) return dependencyFailure(request, "manage_revoke_rpc", error, startedAt);
    if (!data) return fail("Could not revoke the family invitation.", 503);
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  }

  if (action === "regenerate") {
    const maxUses = input.maxUses === undefined || input.maxUses === null
      ? null
      : Number.isInteger(input.maxUses) && (input.maxUses as number) >= 1 && (input.maxUses as number) <= 1000
        ? input.maxUses as number
        : undefined;
    const expiresDays = input.expiresDays === undefined || input.expiresDays === null
      ? null
      : Number.isInteger(input.expiresDays) && (input.expiresDays as number) >= 1 && (input.expiresDays as number) <= 365
        ? input.expiresDays as number
        : undefined;
    if (maxUses === undefined || expiresDays === undefined) return fail("Invitation limits are invalid.");
    const expiresAt = expiresDays === null ? null : new Date(Date.now() + expiresDays * 86_400_000).toISOString();
    const { data, error } = await supabase.rpc(
      "manage_kul_invitation",
      invitationArgs("regenerate", { maxUses, expiresAt }),
    );
    if (error) return dependencyFailure(request, "manage_regenerate_rpc", error, startedAt);
    if (!data || !(data as { success?: boolean }).success) {
      return fail("Could not regenerate the family invitation.", 503);
    }
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  }

  return fail("Invalid action specified.");
}
