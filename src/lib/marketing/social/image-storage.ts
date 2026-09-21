/**
 * Private-draft / public-release image storage for the social publishing
 * pipeline. Adapted from src/app/api/admin/hero-assets/route.ts's upload
 * pattern, but split into two buckets per the approved plan (section 6):
 *
 *   - DRAFT_BUCKET (private): every generated/uploaded candidate image lands
 *     here first. Admin review reads it via a short-lived signed URL, never
 *     a public one.
 *   - PUBLIC_BUCKET (public): written to ONLY by releaseApprovedImage,
 *     always at a fresh content-addressed path derived from the exact
 *     approved bytes (sha256 of the file). Nothing else in this module, or
 *     anywhere else in the pipeline, may write here -- that is what makes
 *     "approved" a real gate rather than a label on an already-public file.
 */
import crypto from "crypto";

const DRAFT_BUCKET = "social-post-drafts";
const PUBLIC_BUCKET = "social-post-assets";
const SIGNED_URL_TTL_SECONDS = 3600;

const ALLOWED_IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png"] as const;
type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

function extensionForContentType(contentType: string): string {
  switch (contentType) {
    case "image/webp":
      return "webp";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    default:
      return "bin";
  }
}

export function isAllowedSocialImageType(contentType: string): contentType is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType);
}

export function computeImageContentHash(bytes: ArrayBuffer | Buffer): string {
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function ensureBucket(supabase: any, bucket: string, isPublic: boolean) {
  await supabase.storage.createBucket(bucket, { public: isPublic }).catch(() => null);
}

/**
 * Uploads a candidate image (admin-uploaded artwork or branded template --
 * Phase 1 ships with no AI image generation, per AGENTS.md section 11) into
 * the private draft bucket. Returns the storage path, never a public URL.
 */
export async function uploadDraftSocialImage(
  supabase: any,
  postId: string,
  bytes: ArrayBuffer,
  contentType: string
): Promise<{ draftPath: string; contentHash: string }> {
  if (!isAllowedSocialImageType(contentType)) {
    throw new Error(`Unsupported image type: ${contentType}`);
  }
  await ensureBucket(supabase, DRAFT_BUCKET, false);

  const contentHash = computeImageContentHash(bytes);
  const ext = extensionForContentType(contentType);
  const draftPath = `${postId}/${contentHash}.${ext}`;

  const { error } = await supabase.storage
    .from(DRAFT_BUCKET)
    .upload(draftPath, bytes, { contentType, upsert: true });

  if (error) {
    throw new Error(`Failed to upload draft social image: ${error.message}`);
  }

  return { draftPath, contentHash };
}

/**
 * Signed, time-limited URL for admin review of a still-private draft image.
 * Never a public URL -- an unapproved image must never be reachable without
 * this signature, however briefly the link lives.
 */
export async function getSignedDraftImageUrl(supabase: any, draftPath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(DRAFT_BUCKET)
    .createSignedUrl(draftPath, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to sign draft image URL: ${error?.message ?? "no URL returned"}`);
  }
  return data.signedUrl;
}

/** Re-derives the content hash of a still-private draft image directly from
 * its stored bytes (never trusts a caller-supplied hash). Used at approval
 * time to bind approved_image_content_hash to the exact bytes on disk. */
export async function getDraftImageContentHash(supabase: any, draftPath: string): Promise<string> {
  const { data: draftFile, error } = await supabase.storage.from(DRAFT_BUCKET).download(draftPath);
  if (error || !draftFile) {
    throw new Error(`Failed to read draft image for hashing: ${error?.message ?? "not found"}`);
  }
  return computeImageContentHash(Buffer.from(await draftFile.arrayBuffer()));
}

/**
 * The ONLY function in this pipeline that writes to the public bucket.
 * Called exactly once, at the approve action. Downloads the exact approved
 * draft bytes, re-derives their hash (never trusts a caller-supplied hash --
 * this is the actual enforcement point for "approval binds to these exact
 * bytes," not just a bookkeeping copy), and writes them to a fresh
 * content-addressed public path. Re-approving the same bytes twice is a
 * harmless no-op (same hash, same path, upsert).
 */
export async function releaseApprovedSocialImage(
  supabase: any,
  draftPath: string
): Promise<{ publicUrl: string; contentHash: string }> {
  await ensureBucket(supabase, PUBLIC_BUCKET, true);

  const { data: draftFile, error: downloadError } = await supabase.storage
    .from(DRAFT_BUCKET)
    .download(draftPath);

  if (downloadError || !draftFile) {
    throw new Error(`Failed to read draft image for release: ${downloadError?.message ?? "not found"}`);
  }

  const bytes = Buffer.from(await draftFile.arrayBuffer());
  const contentHash = computeImageContentHash(bytes);
  const ext = draftPath.split(".").pop() ?? "webp";
  const publicPath = `${contentHash}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PUBLIC_BUCKET)
    .upload(publicPath, bytes, {
      contentType: draftFile.type || "application/octet-stream",
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Failed to release approved social image: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(publicPath);
  return { publicUrl: publicUrlData.publicUrl, contentHash };
}
