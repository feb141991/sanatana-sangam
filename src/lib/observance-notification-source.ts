import type { SupabaseClient } from '@supabase/supabase-js';
import { mapOccurrenceToFestival, type Festival } from '@/lib/festivals';

type ReviewedObservanceKind = 'major' | 'regional' | 'vrat';

export type ReviewedObservance = Festival & {
  slug: string | null;
  sourceEligible: true;
};

export type ObservanceNotificationAudience = 'general' | 'female';

export type ObservanceNotificationPreview = {
  date: string;
  slug: string;
  name: string;
  kind: Festival['type'];
  audience: ObservanceNotificationAudience;
  daysAway: number;
  route: string;
  notificationKey: string;
};

const OCCURRENCE_BACKED_TITHI_SLUGS = new Set([
  'ekadashi',
  'pradosh-vrat',
  'purnima-vrat',
  'amavasya-vrat',
  'vinayaka-chaturthi',
  'sankashti-chaturthi',
]);

export const OCCURRENCE_BACKED_TITHI_INDICES = new Set([4, 11, 13, 15, 19, 26, 28, 30]);

const WOMEN_VRAT_SLUGS = new Set([
  'vat-savitri',
  'vat-savitri-amavasya',
  'vat-savitri-vrat',
  'vat-savitri-purnima',
  'hartalika-teej',
  'karva-chauth',
]);

const WOMEN_VRAT_NAMES = new Set([
  'vat savitri vrat',
  'vat savitri purnima',
  'hartalika teej',
  'karva chauth',
]);

function normalizeName(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase();
}

export function isReviewedNotificationObservance(row: any, allowedKinds: Set<ReviewedObservanceKind>) {
  const def = row?.observance_definitions ?? {};
  if (def.active === false) return false;
  if (!allowedKinds.has(def.kind)) return false;

  return row.review_status === 'reviewed'
    && row.verification_status === 'verified'
    && row.audit_status === 'completed'
    && row.final_date_source !== 'fallback'
    && Boolean(row.date || row.manual_date_override);
}

export async function fetchReviewedObservancesForNotifications(
  supabase: SupabaseClient,
  allowedKinds: ReviewedObservanceKind[],
): Promise<{ observances: ReviewedObservance[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('observance_occurrences')
    .select('*, observance_definitions(*)')
    .eq('review_status', 'reviewed')
    .eq('verification_status', 'verified')
    .eq('audit_status', 'completed')
    .neq('final_date_source', 'fallback')
    .order('date', { ascending: true });

  if (error) {
    return { observances: [], error: new Error(error.message) };
  }

  const kindSet = new Set(allowedKinds);
  const observances = (data ?? [])
    .filter((row) => isReviewedNotificationObservance(row, kindSet))
    .map((row) => ({
      ...mapOccurrenceToFestival(row),
      slug: row.observance_definitions?.slug ?? null,
      sourceEligible: true as const,
    }));

  return { observances, error: null };
}

export function filterWomenFocusedVrats(observances: ReviewedObservance[]) {
  return observances.filter((observance) => {
    const slug = normalizeName(observance.slug);
    const name = normalizeName(observance.name);
    return WOMEN_VRAT_SLUGS.has(slug) || WOMEN_VRAT_NAMES.has(name);
  });
}

export function isWomenFocusedVrat(observance: ReviewedObservance) {
  const slug = normalizeName(observance.slug);
  const name = normalizeName(observance.name);
  return WOMEN_VRAT_SLUGS.has(slug) || WOMEN_VRAT_NAMES.has(name);
}

export function filterGeneralOccurrenceBackedVrats(observances: ReviewedObservance[]) {
  return observances.filter((observance) => {
    const slug = normalizeName(observance.slug);
    return OCCURRENCE_BACKED_TITHI_SLUGS.has(slug) || !isWomenFocusedVrat(observance);
  });
}

export function buildObservanceActionPath(observance: Pick<ReviewedObservance, 'route_kind' | 'route_slug' | 'slug' | 'type'>) {
  const routeKind = observance.route_kind ?? null;
  const routeSlug = observance.route_slug ?? observance.slug ?? null;

  if (routeKind === 'vrat') {
    return routeSlug ? `/vrat/${routeSlug}` : '/vrat';
  }

  if (routeKind === 'festival') {
    return routeSlug ? `/festivals/${routeSlug}` : '/panchang';
  }

  if (routeKind === 'panchang') return '/panchang';
  if (routeKind === 'home') return '/home';

  return observance.type === 'vrat' ? '/vrat' : '/panchang';
}

export function buildOccurrenceNotificationKey(
  observance: Pick<ReviewedObservance, 'id' | 'slug' | 'name'>,
  audience: ObservanceNotificationAudience,
  daysAway: number,
  localDate: string,
) {
  const sourceId = observance.id ?? observance.slug ?? observance.name;
  return `observance:${audience}:${sourceId}:${daysAway}:${localDate}`;
}

export function buildObservancePreviewRow(
  observance: ReviewedObservance,
  audience: ObservanceNotificationAudience,
  daysAway: number,
  localDate: string,
  notificationKey = buildOccurrenceNotificationKey(observance, audience, daysAway, localDate),
): ObservanceNotificationPreview {
  return {
    date: observance.date,
    slug: observance.slug ?? String(observance.id ?? observance.name),
    name: observance.name,
    kind: observance.type,
    audience,
    daysAway,
    route: buildObservanceActionPath(observance),
    notificationKey,
  };
}
