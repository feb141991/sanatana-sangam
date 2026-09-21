/**
 * Facebook Page and Instagram Business publishing via the Meta Graph API.
 *
 * Neither endpoint used here documents a client-supplied idempotency key --
 * Graph API's /{page-id}/photos and /{ig-user-id}/media_publish have no
 * such parameter. This is exactly why the pipeline treats a thrown/timeout
 * error here as `outcome: "unknown"` rather than assuming failure, and why
 * reconciliation.ts exists as the actual safety net for Facebook/Instagram,
 * not a retried "idempotent" call. `idempotencyKey` is still threaded
 * through for our own request tracing (stored as provider_request_id).
 */
import type { PublisherSendInput, PublisherSendResult } from "../types";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

const CONTAINER_POLL_INTERVAL_MS = 2000;
const CONTAINER_POLL_TIMEOUT_MS = 60000;

function combineCaption(caption: string, hashtags: string[]): string {
  const tagLine = hashtags.length > 0 ? `\n\n${hashtags.map(h => (h.startsWith("#") ? h : `#${h}`)).join(" ")}` : "";
  return `${caption}${tagLine}`;
}

async function graphFetch(path: string, params: Record<string, string>, method: "GET" | "POST" = "POST") {
  const url = new URL(`${GRAPH_API_BASE}${path}`);
  if (method === "GET") {
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    method,
    ...(method === "POST"
      ? {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(params).toString()
        }
      : {})
  });

  const payload = (await response.json().catch(() => null)) as any;
  return { ok: response.ok, status: response.status, payload };
}

export async function publishToFacebookPage(input: PublisherSendInput): Promise<PublisherSendResult> {
  const { ok, status, payload } = await graphFetch(`/${input.account.external_account_id}/photos`, {
    url: input.imageUrl,
    caption: combineCaption(input.caption, input.hashtags),
    access_token: input.accessToken
  });

  if (ok && payload?.post_id) {
    return {
      outcome: "succeeded",
      providerRequestId: input.idempotencyKey,
      externalPostId: payload.post_id,
      permalinkUrl: `https://www.facebook.com/${payload.post_id}`
    };
  }

  const errorSubcode = payload?.error?.error_subcode;
  const errorMessage: string = payload?.error?.message ?? `Graph API returned ${status}`;

  // A definite, well-formed rejection (bad token, permission denied, invalid
  // image) is a real "rejected" outcome -- distinct from a network failure or
  // an ambiguous response, which must be "unknown," never "rejected."
  if (ok === false && payload?.error && typeof payload.error.code === "number") {
    return { outcome: "rejected", providerRequestId: input.idempotencyKey, errorSummary: `fb_error_${payload.error.code}_${errorSubcode ?? "na"}: ${errorMessage}`.slice(0, 500) };
  }

  return { outcome: "unknown", providerRequestId: input.idempotencyKey, errorSummary: `unexpected_response_${status}: ${errorMessage}`.slice(0, 500) };
}

async function pollInstagramContainerReady(
  creationId: string,
  accessToken: string
): Promise<"FINISHED" | "ERROR" | "TIMED_OUT"> {
  const deadline = Date.now() + CONTAINER_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const { ok, payload } = await graphFetch(`/${creationId}`, { fields: "status_code", access_token: accessToken }, "GET");
    const statusCode = payload?.status_code;
    if (ok && statusCode === "FINISHED") return "FINISHED";
    if (ok && statusCode === "ERROR") return "ERROR";
    await new Promise(resolve => setTimeout(resolve, CONTAINER_POLL_INTERVAL_MS));
  }
  return "TIMED_OUT";
}

export async function publishToInstagram(input: PublisherSendInput): Promise<PublisherSendResult> {
  const igUserId = input.account.external_account_id;

  const createRes = await graphFetch(`/${igUserId}/media`, {
    image_url: input.imageUrl,
    caption: combineCaption(input.caption, input.hashtags),
    access_token: input.accessToken
  });

  const creationId = createRes.payload?.id;
  if (!createRes.ok || !creationId) {
    const message: string = createRes.payload?.error?.message ?? `container creation failed with ${createRes.status}`;
    return { outcome: "rejected", providerRequestId: input.idempotencyKey, errorSummary: `ig_container_failed: ${message}`.slice(0, 500) };
  }

  const readiness = await pollInstagramContainerReady(creationId, input.accessToken);
  if (readiness === "ERROR") {
    return { outcome: "rejected", providerRequestId: input.idempotencyKey, platformIntermediateRef: creationId, errorSummary: "ig_container_status_error" };
  }
  if (readiness === "TIMED_OUT") {
    // The container may still finish and get published by a stray retry later --
    // this is genuinely unknown, not a failure, and must never be auto-retried
    // from scratch (that would risk a duplicate publish of the same container).
    return { outcome: "unknown", providerRequestId: input.idempotencyKey, platformIntermediateRef: creationId, errorSummary: "ig_container_readiness_poll_timed_out" };
  }

  const publishRes = await graphFetch(`/${igUserId}/media_publish`, {
    creation_id: creationId,
    access_token: input.accessToken
  });

  if (publishRes.ok && publishRes.payload?.id) {
    return {
      outcome: "succeeded",
      providerRequestId: input.idempotencyKey,
      platformIntermediateRef: creationId,
      externalPostId: publishRes.payload.id,
      permalinkUrl: null // Graph API's media_publish response carries no permalink; a
      // separate GET /{media-id}?fields=permalink call would be needed to backfill it.
    };
  }

  const message: string = publishRes.payload?.error?.message ?? `media_publish failed with ${publishRes.status}`;
  if (publishRes.payload?.error && typeof publishRes.payload.error.code === "number") {
    return { outcome: "rejected", providerRequestId: input.idempotencyKey, platformIntermediateRef: creationId, errorSummary: `ig_publish_rejected: ${message}`.slice(0, 500) };
  }
  return { outcome: "unknown", providerRequestId: input.idempotencyKey, platformIntermediateRef: creationId, errorSummary: `ig_publish_unexpected: ${message}`.slice(0, 500) };
}
