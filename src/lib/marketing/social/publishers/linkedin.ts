/**
 * LinkedIn organization posting via the versioned REST API (Posts API +
 * Images API). LinkedIn documents no lookup-by-idempotency-key capability
 * for either endpoint, so -- same as meta.ts -- a thrown/ambiguous response
 * here must resolve to `outcome: "unknown"`, and reconciliation.ts treats
 * every LinkedIn "unknown" as a direct human-investigation case with no
 * automated candidate match (unlike Facebook/Instagram's recent-posts
 * heuristic).
 */
import type { PublisherSendInput, PublisherSendResult } from "../types";

const LINKEDIN_API_BASE = "https://api.linkedin.com/rest";
// Pinned explicitly, per the approved plan's platform-integration corrections --
// LinkedIn requires a LinkedIn-Version header and breaks callers that omit one
// or drift across an unpinned "latest." Bump deliberately, not implicitly.
const LINKEDIN_API_VERSION = "202501";

const IMAGE_POLL_INTERVAL_MS = 2000;
const IMAGE_POLL_TIMEOUT_MS = 60000;

function linkedInHeaders(accessToken: string, extra?: Record<string, string>) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": LINKEDIN_API_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
    "Content-Type": "application/json",
    ...extra
  };
}

interface ImageUploadResult {
  imageUrn: string;
}

async function registerAndUploadImage(
  orgUrn: string,
  accessToken: string,
  imageUrl: string
): Promise<ImageUploadResult> {
  const initRes = await fetch(`${LINKEDIN_API_BASE}/images?action=initializeUpload`, {
    method: "POST",
    headers: linkedInHeaders(accessToken),
    body: JSON.stringify({ initializeUploadRequest: { owner: orgUrn } })
  });
  const initPayload = (await initRes.json().catch(() => null)) as any;
  const uploadUrl: string | undefined = initPayload?.value?.uploadUrl;
  const imageUrn: string | undefined = initPayload?.value?.image;

  if (!initRes.ok || !uploadUrl || !imageUrn) {
    throw new Error(`linkedin_image_init_failed: ${initPayload?.message ?? initRes.status}`);
  }

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    throw new Error(`linkedin_source_image_fetch_failed: ${imageRes.status}`);
  }
  const imageBytes = await imageRes.arrayBuffer();

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: imageBytes
  });
  if (!uploadRes.ok) {
    throw new Error(`linkedin_image_upload_failed: ${uploadRes.status}`);
  }

  return { imageUrn };
}

async function pollImageReady(imageUrn: string, accessToken: string): Promise<"AVAILABLE" | "PROCESSING_FAILED" | "TIMED_OUT"> {
  const deadline = Date.now() + IMAGE_POLL_TIMEOUT_MS;
  const encodedUrn = encodeURIComponent(imageUrn);
  while (Date.now() < deadline) {
    const res = await fetch(`${LINKEDIN_API_BASE}/images/${encodedUrn}`, {
      headers: linkedInHeaders(accessToken)
    });
    const payload = (await res.json().catch(() => null)) as any;
    const status = payload?.status;
    if (res.ok && status === "AVAILABLE") return "AVAILABLE";
    if (res.ok && status === "PROCESSING_FAILED") return "PROCESSING_FAILED";
    await new Promise(resolve => setTimeout(resolve, IMAGE_POLL_INTERVAL_MS));
  }
  return "TIMED_OUT";
}

function combineCaption(caption: string, hashtags: string[]): string {
  const tagLine = hashtags.length > 0 ? `\n\n${hashtags.map(h => (h.startsWith("#") ? h : `#${h}`)).join(" ")}` : "";
  return `${caption}${tagLine}`;
}

export async function publishToLinkedIn(input: PublisherSendInput): Promise<PublisherSendResult> {
  const orgUrn = `urn:li:organization:${input.account.external_account_id}`;

  let imageUrn: string;
  try {
    const upload = await registerAndUploadImage(orgUrn, input.accessToken, input.imageUrl);
    imageUrn = upload.imageUrn;
  } catch (err: any) {
    return { outcome: "unknown", providerRequestId: input.idempotencyKey, errorSummary: String(err?.message ?? err).slice(0, 500) };
  }

  const readiness = await pollImageReady(imageUrn, input.accessToken);
  if (readiness === "PROCESSING_FAILED") {
    return { outcome: "rejected", providerRequestId: input.idempotencyKey, platformIntermediateRef: imageUrn, errorSummary: "linkedin_image_processing_failed" };
  }
  if (readiness === "TIMED_OUT") {
    return { outcome: "unknown", providerRequestId: input.idempotencyKey, platformIntermediateRef: imageUrn, errorSummary: "linkedin_image_readiness_poll_timed_out" };
  }

  const postRes = await fetch(`${LINKEDIN_API_BASE}/posts`, {
    method: "POST",
    headers: linkedInHeaders(input.accessToken),
    body: JSON.stringify({
      author: orgUrn,
      commentary: combineCaption(input.caption, input.hashtags),
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      content: { media: { id: imageUrn } },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false
    })
  });

  // The Posts API returns 201 with no body; the created post's URN is in the
  // x-restli-id response header.
  const postUrn = postRes.headers.get("x-restli-id");

  if (postRes.ok && postUrn) {
    return {
      outcome: "succeeded",
      providerRequestId: input.idempotencyKey,
      platformIntermediateRef: imageUrn,
      externalPostId: postUrn,
      permalinkUrl: `https://www.linkedin.com/feed/update/${postUrn}`
    };
  }

  const payload = (await postRes.json().catch(() => null)) as any;
  const message: string = payload?.message ?? `linkedin post creation failed with ${postRes.status}`;

  if (postRes.status >= 400 && postRes.status < 500) {
    return { outcome: "rejected", providerRequestId: input.idempotencyKey, platformIntermediateRef: imageUrn, errorSummary: message.slice(0, 500) };
  }
  return { outcome: "unknown", providerRequestId: input.idempotencyKey, platformIntermediateRef: imageUrn, errorSummary: message.slice(0, 500) };
}
