/**
 * Per-publisher-honest reconciliation for `outcome_unknown` variants.
 * Facebook/Instagram get a heuristic "probable match, confirm manually"
 * candidate via a recent-posts listing. LinkedIn has no documented
 * lookup-by-idempotency-key or recent-posts-by-app capability, so every
 * LinkedIn outcome_unknown is a direct human-investigation case with no
 * automated candidate -- never presented as "likely posted."
 *
 * This module only SURFACES candidates; committing a resolution always
 * goes through record_social_reconciliation_finding (a human action, never
 * automatic) via resolveReconciliation below.
 */
import crypto from "crypto";
import type { SocialPlatformAccount, SocialPostVariant } from "./types";

export interface ReconciliationCandidate {
  externalPostId: string;
  permalinkUrl: string | null;
  createdTime: string;
  captionSnippet: string | null;
}

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const LOOKBACK_HOURS = 6;

function captionMatchesLoosely(candidateMessage: string | undefined, variantCaption: string): boolean {
  if (!candidateMessage) return false;
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 60);
  return normalize(candidateMessage).includes(normalize(variantCaption).slice(0, 30));
}

export async function findFacebookReconciliationCandidates(
  account: SocialPlatformAccount,
  accessToken: string,
  variant: SocialPostVariant
): Promise<ReconciliationCandidate[]> {
  const since = new Date(Date.now() - LOOKBACK_HOURS * 3600 * 1000).toISOString();
  const url = new URL(`${GRAPH_API_BASE}/${account.external_account_id}/posts`);
  url.searchParams.set("fields", "id,message,created_time,permalink_url");
  url.searchParams.set("since", since);
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString());
  const payload = (await res.json().catch(() => null)) as any;
  if (!res.ok) return [];

  const posts: Array<{ id: string; message?: string; created_time: string; permalink_url?: string }> = payload?.data ?? [];
  return posts
    .filter(p => captionMatchesLoosely(p.message, variant.caption))
    .map(p => ({
      externalPostId: p.id,
      permalinkUrl: p.permalink_url ?? null,
      createdTime: p.created_time,
      captionSnippet: p.message?.slice(0, 120) ?? null
    }));
}

export async function findInstagramReconciliationCandidates(
  account: SocialPlatformAccount,
  accessToken: string,
  variant: SocialPostVariant
): Promise<ReconciliationCandidate[]> {
  const since = new Date(Date.now() - LOOKBACK_HOURS * 3600 * 1000).toISOString();
  const url = new URL(`${GRAPH_API_BASE}/${account.external_account_id}/media`);
  url.searchParams.set("fields", "id,caption,timestamp,permalink");
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString());
  const payload = (await res.json().catch(() => null)) as any;
  if (!res.ok) return [];

  const media: Array<{ id: string; caption?: string; timestamp: string; permalink?: string }> = payload?.data ?? [];
  return media
    .filter(m => m.timestamp >= since && captionMatchesLoosely(m.caption, variant.caption))
    .map(m => ({
      externalPostId: m.id,
      permalinkUrl: m.permalink ?? null,
      createdTime: m.timestamp,
      captionSnippet: m.caption?.slice(0, 120) ?? null
    }));
}

/**
 * Dispatches by platform. Always returns [] for LinkedIn -- never fabricate
 * a "probable match" where the platform provides no honest way to find one.
 */
export async function findReconciliationCandidates(
  variant: SocialPostVariant,
  account: SocialPlatformAccount,
  accessToken: string
): Promise<ReconciliationCandidate[]> {
  if (variant.platform === "facebook") return findFacebookReconciliationCandidates(account, accessToken, variant);
  if (variant.platform === "instagram") return findInstagramReconciliationCandidates(account, accessToken, variant);
  return [];
}

export type ReconciliationResolution = "confirmed_published" | "confirmed_not_published";

/**
 * Commits a human's investigation result. Always goes through the
 * transactional RPC -- never a direct .update() on social_post_variants --
 * so the reconciliation_finding event and the status change land in the
 * same transaction and can never disagree after a crash.
 */
export async function resolveReconciliation(
  supabase: any,
  params: {
    variantId: string;
    adminIdentifier: string;
    resolution: ReconciliationResolution;
    externalPostId?: string | null;
    permalinkUrl?: string | null;
    notes?: string | null;
  }
): Promise<void> {
  const { error } = await supabase.rpc("record_social_reconciliation_finding", {
    p_variant_id: params.variantId,
    p_attempt_id: crypto.randomUUID(),
    p_admin_identifier: params.adminIdentifier,
    p_resolution: params.resolution,
    p_external_post_id: params.externalPostId ?? null,
    p_permalink_url: params.permalinkUrl ?? null,
    p_notes: params.notes ?? null
  });

  if (error) {
    throw new Error(`Failed to record reconciliation finding: ${error.message}`);
  }
}
