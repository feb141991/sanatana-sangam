/**
 * Mirrors src/lib/marketing/campaign-service.ts's computeContentHash
 * convention: the hash is computed in Node and always passed explicitly on
 * every write that touches these fields -- the DB trigger
 * (bump_social_variant_content_version) only bumps content_version and
 * clears approval when it detects these fields changed; it does not
 * compute the hash itself.
 */
import crypto from "crypto";

export interface SocialVariantManifestInput {
  platform: string;
  caption: string;
  hashtags: string[];
  cta_url: string | null;
  source_citations: unknown[];
}

export function computeSocialVariantContentHash(input: SocialVariantManifestInput): string {
  const canonical = JSON.stringify({
    platform: input.platform,
    caption: input.caption,
    hashtags: input.hashtags,
    cta_url: input.cta_url ?? null,
    source_citations: input.source_citations ?? []
  });
  return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
}
