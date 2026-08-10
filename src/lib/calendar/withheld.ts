/**
 * Publication withholding for occurrences ALREADY STORED IN THE DATABASE.
 *
 * WHY THIS EXISTS SEPARATELY FROM `isPublishableForYear`
 * -----------------------------------------------------
 * That function gates CALCULATION. This one gates READS. They are not the same
 * gate and the difference is not academic: when the disputed-years gate landed,
 * five contested occurrences were already sitting in `observance_occurrences`,
 * written before the gate existed. Gating the calculator stopped new ones being
 * produced and did nothing whatsoever about the rows already there, which every
 * calendar endpoint went on serving.
 *
 * The lesson generalises. A gate at write time protects only the future; a gate
 * at read time protects what is already stored. Anything derived from rules.json
 * that decides whether a user may see something needs both, because the database
 * is older than the rule that governs it.
 *
 * DEFENCE IN DEPTH, NOT A REPLACEMENT FOR CLEANUP
 * -----------------------------------------------
 * The stored rows should also be quarantined at the database level. This filter
 * is the layer that holds regardless -- it keeps working if a quarantine misses
 * a row, if a row is re-materialised by an older deployment, or if an admin
 * approves a disputed row by hand (the database has no knowledge of
 * `disputed_years`, so nothing there would stop them).
 */
import { CANONICAL_RULES } from './rules';
import { isPublishableForYear } from './engine';

/** slug -> rule, for O(1) lookup on hot read paths. */
const BY_SLUG = new Map(CANONICAL_RULES.map(r => [r.slug, r]));

/**
 * Whether a stored occurrence must be withheld from public output.
 *
 * Unknown slugs return `false` (not withheld). A slug with no rule cannot be
 * disputed by a rule, and failing open here keeps a stale definition visible
 * rather than silently blanking a calendar -- the visible-but-stale failure gets
 * noticed and fixed, the silent one does not.
 */
export function isWithheldOccurrence(slug: string | null | undefined, date: string | null | undefined): boolean {
  if (!slug || !date) return false;
  const rule = BY_SLUG.get(slug);
  if (!rule) return false;
  const year = Number(date.slice(0, 4));
  if (!Number.isFinite(year)) return false;
  return !isPublishableForYear(rule, year);
}

/**
 * Filters stored occurrence rows, dropping withheld ones.
 *
 * `getSlug`/`getDate` are passed in because the routes select different shapes:
 * some join `observance_definitions(slug)`, some alias the date column. Rather
 * than force one shape on five endpoints, each says where its fields live.
 */
export function filterWithheldOccurrences<T>(
  rows: T[],
  getSlug: (row: T) => string | null | undefined,
  getDate: (row: T) => string | null | undefined,
): T[] {
  return rows.filter(row => !isWithheldOccurrence(getSlug(row), getDate(row)));
}

/**
 * Convenience for the common `{ date, observance_definitions: { slug } }` shape.
 *
 * Deliberately unconstrained in `T`. A structural `T extends { ... }` bound looks
 * tighter but is worse here: the generated Supabase row types model a join as
 * `{ slug: any }[]` in some routes and `{ slug: any }` in others, so a bound
 * matching one shape rejects the other, and widening the parameter to satisfy
 * both would widen the RETURN type too -- callers would lose the fields they
 * actually use. Preserving `T` exactly keeps every call site's own type intact
 * and lets this be dropped into a query chain without reshaping anything.
 */
export function filterWithheldJoinedRows<T>(rows: T[]): T[] {
  return rows.filter(row => {
    const r = row as {
      date?: string | null;
      occurrence_date?: string | null;
      observance_definitions?: { slug?: string | null } | Array<{ slug?: string | null }> | null;
    };
    const def = Array.isArray(r.observance_definitions)
      ? r.observance_definitions[0]
      : r.observance_definitions;
    return !isWithheldOccurrence(def?.slug, r.date ?? r.occurrence_date);
  });
}
