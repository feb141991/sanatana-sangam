import type { SupabaseClient } from '@supabase/supabase-js';
import type { Json } from '@/types/database';
import { filterWithheldJoinedRows } from './calendar/withheld';
import { mapOccurrenceToFestival, type Festival } from '@/lib/festivals';

export type ReviewedObservanceKind = 'major' | 'regional' | 'vrat';

export type ReviewedObservance = Festival & {
  slug: string | null;
  sourceEligible: true;
  reviewStatus?: string;
  verificationStatus?: string;
  publicationStatus?: string;
  auditStatus?: string;
  finalDateSource?: string | null;
  sourceRefs?: Json[];
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

export const OCCURRENCE_BACKED_TITHI_SLUGS = new Set([
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
  dateRange?: { fromDate: string; toDate: string },
): Promise<{ observances: ReviewedObservance[]; error: Error | null }> {
  const PAGE_SIZE = 500;
  const data: any[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    let query = supabase
      .from('observance_occurrences')
      .select('*, observance_definitions(*)')
      .eq('review_status', 'reviewed')
      .eq('verification_status', 'verified')
      .eq('audit_status', 'completed')
      .neq('final_date_source', 'fallback')
      // Fail closed: only published rows can produce notification candidates.
      .eq('publication_status', 'published');
    if (dateRange) {
      // `manual_date_override` is the effective date when present. Include it
      // explicitly so bounded cron reads do not miss reviewed override rows.
      query = query.or(
        `and(date.gte.${dateRange.fromDate},date.lte.${dateRange.toDate}),and(manual_date_override.gte.${dateRange.fromDate},manual_date_override.lte.${dateRange.toDate})`,
      );
    }
    const { data: page, error } = await query
      .order('date', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) return { observances: [], error: new Error(error.message) };
    const rows = page ?? [];
    data.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }

  // The reviewed+verified+completed filter above already excludes today's
  // disputed rows -- but only by accident, because nobody has approved them yet.
  // The database has no knowledge of `disputed_years`, so an admin could approve
  // one at any time and it would immediately become notification-eligible.
  // A push notification cannot be recalled, so the protection is made explicit.

  const kindSet = new Set(allowedKinds);
  const observances = filterWithheldJoinedRows(data)
    .filter((row) => isReviewedNotificationObservance(row, kindSet))
    .map((row) => ({
      ...mapOccurrenceToFestival(row),
      slug: row.observance_definitions?.slug ?? null,
      sourceEligible: true as const,
      reviewStatus: row.review_status,
      verificationStatus: row.verification_status,
      publicationStatus: row.publication_status,
      auditStatus: row.audit_status,
      finalDateSource: row.final_date_source ?? null,
      sourceRefs: Array.isArray(row.source_refs) ? row.source_refs : [],
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

/**
 * Deduplicates generic recurring tithi vrats when a specific named observance exists on the same civil date.
 * For example: on Mahalaya Amavasya (2026-10-10), both 'mahalaya-amavasya' and 'amavasya-vrat' exist.
 * The generic monthly recurring 'amavasya-vrat' is suppressed so users only receive the specific
 * 'Mahalaya Amavasya' notification.
 */
export function deduplicateTithiVrats<
  T extends { date: string; slug?: string | null; name?: string | null; route_slug?: string | null }
>(observances: T[]): T[] {
  const byDate = new Map<string, T[]>();
  for (const obs of observances) {
    const list = byDate.get(obs.date) ?? [];
    list.push(obs);
    byDate.set(obs.date, list);
  }

  const result: T[] = [];

  for (const list of byDate.values()) {
    if (list.length <= 1) {
      result.push(...list);
      continue;
    }

    const familiesPresent = new Set<'amavasya' | 'purnima' | 'ekadashi' | 'pradosh' | 'chaturthi'>();

    for (const obs of list) {
      const slug = normalizeName(obs.slug);
      const name = normalizeName(obs.name);
      const routeSlug = normalizeName(obs.route_slug);

      // If this is a specific observance (not in OCCURRENCE_BACKED_TITHI_SLUGS)
      if (!OCCURRENCE_BACKED_TITHI_SLUGS.has(slug)) {
        if (routeSlug === 'amavasya' || slug.includes('amavasya') || name.includes('amavasya')) {
          familiesPresent.add('amavasya');
        }
        if (routeSlug === 'purnima' || slug.includes('purnima') || name.includes('purnima')) {
          familiesPresent.add('purnima');
        }
        if (routeSlug === 'ekadashi' || slug.includes('ekadashi') || name.includes('ekadashi')) {
          familiesPresent.add('ekadashi');
        }
        if (routeSlug === 'pradosh' || slug.includes('pradosh') || name.includes('pradosh')) {
          familiesPresent.add('pradosh');
        }
        if (
          routeSlug === 'chaturthi' ||
          routeSlug === 'sankashti-chaturthi' ||
          slug.includes('chaturthi') ||
          slug.includes('chauth') ||
          name.includes('chaturthi') ||
          name.includes('chauth')
        ) {
          familiesPresent.add('chaturthi');
        }
      }
    }

    for (const obs of list) {
      const slug = normalizeName(obs.slug);
      if (slug === 'amavasya-vrat' && familiesPresent.has('amavasya')) {
        continue;
      }
      if (slug === 'purnima-vrat' && familiesPresent.has('purnima')) {
        continue;
      }
      if (slug === 'ekadashi' && familiesPresent.has('ekadashi')) {
        continue;
      }
      if (slug === 'pradosh-vrat' && familiesPresent.has('pradosh')) {
        continue;
      }
      if (
        (slug === 'vinayaka-chaturthi' || slug === 'sankashti-chaturthi') &&
        familiesPresent.has('chaturthi')
      ) {
        continue;
      }
      result.push(obs);
    }
  }

  return result;
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
