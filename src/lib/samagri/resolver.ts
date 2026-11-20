import { SACRED_SAMAGRI_CATALOG } from '@/config/samagri-catalog';
import type { ObservanceSamagriPayload, SacredProduct } from '@/types/samagri';

/**
 * Normalizes an observance slug to ensure accurate matching.
 */
function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase().replace(/^katha-/, '').replace(/^vrat-/, '');
}

/**
 * Resolves curated pooja packs and companion essentials for a given observance or festival.
 */
export function getSamagriForObservance(
  observanceSlug: string,
  targetDateStr?: string
): ObservanceSamagriPayload | null {
  const normalized = normalizeSlug(observanceSlug);

  // 1. Find dedicated pooja kit
  const matchedKit = SACRED_SAMAGRI_CATALOG.find(
    (product) =>
      product.category === 'pooja-kit' &&
      product.targetObservanceSlugs?.some((target) => {
        const normTarget = normalizeSlug(target);
        return normTarget === normalized || normalized.includes(normTarget);
      })
  );

  if (!matchedKit) {
    return null;
  }

  // 2. Select 2 companion essentials (e.g. Pure Ganga Jal & Charcoal-free Dhoop)
  const companionEssentials = SACRED_SAMAGRI_CATALOG.filter(
    (product) =>
      product.id !== matchedKit.id &&
      (product.category === 'ganga-jal' || product.category === 'dhoop-incense' || product.category === 'camphor')
  ).slice(0, 2);

  // 3. Compute recommended order deadline (typically 4 days prior to observance)
  let recommendedOrderDeadline: string | undefined = undefined;
  if (targetDateStr) {
    const targetDate = new Date(targetDateStr);
    if (!isNaN(targetDate.getTime())) {
      const deadline = new Date(targetDate);
      deadline.setDate(deadline.getDate() - 4);
      recommendedOrderDeadline = deadline.toISOString().split('T')[0];
    }
  }

  return {
    kit: matchedKit,
    ritualContext: {
      observanceName: matchedKit.title.replace(' Complete Pooja Box', '').replace(' Kit', ''),
      targetDate: targetDateStr,
      deliveryEstimatedDays: 3,
      recommendedOrderDeadline,
    },
    companionEssentials,
  };
}

/**
 * Lists all active sacred provisions by category.
 */
export function getAllSacredProducts(): readonly SacredProduct[] {
  return SACRED_SAMAGRI_CATALOG;
}

/**
 * Gets a single product by its slug.
 */
export function getSacredProductBySlug(slug: string): SacredProduct | null {
  return SACRED_SAMAGRI_CATALOG.find((p) => p.slug === slug) ?? null;
}
