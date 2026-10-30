import type { ClientObservanceResult } from './observance-formatter';

export interface FestivalReaderTarget {
  slug: string;
  occurrenceId?: string;
  date?: string;
  variantKey?: string;
}

export interface FestivalReaderSelectionResult {
  occurrence: ClientObservanceResult | null;
  candidates: ClientObservanceResult[];
  selection: 'selected' | 'multiple' | 'unavailable';
}

/**
 * Select only within canonical, verified results; never replace an exact target with a nearby occurrence.
 * Never silently choose between recognised traditions: if multiple variants exist, return selection='multiple'
 * with all candidate variants so the caller is forced to expose the choice.
 */
export function selectFestivalReaderOccurrence(
  results: ClientObservanceResult[],
  target: FestivalReaderTarget,
): FestivalReaderSelectionResult {
  // Only resolved occurrences with a real civilDate are valid candidate dates.
  // Unresolved, under-review, ambiguous or withheld rows must never present a final date.
  let candidates = results.filter(row =>
    (row.slug === target.slug || row.route_slug === target.slug)
    && row.status === 'resolved'
    && row.civilDate !== null
    && (!target.occurrenceId || row.id === target.occurrenceId)
    && (!target.date || row.civilDate === target.date)
    && (!target.variantKey || row.variantKey === target.variantKey)
  );

  candidates.sort((a, b) =>
    a.civilDate!.localeCompare(b.civilDate!) || String(a.id ?? '').localeCompare(String(b.id ?? ''))
  );

  if (!target.occurrenceId && !target.date && candidates.length > 0) {
    // Repeated annual or monthly occurrences are distinct events across the year.
    // Group only within the immediate upcoming event window (same day or adjacent sampradaya variant, <= 2 days).
    const firstDate = candidates[0].civilDate!;
    const firstDateMs = new Date(`${firstDate}T00:00:00Z`).getTime();
    candidates = candidates.filter(row => {
      const rowMs = new Date(`${row.civilDate!}T00:00:00Z`).getTime();
      const diffDays = (rowMs - firstDateMs) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 2;
    });
  }

  if (candidates.length === 0) {
    return {
      occurrence: null,
      candidates: [],
      selection: 'unavailable',
    };
  }

  // If the caller explicitly supplied an occurrenceId, check if it matched
  if (target.occurrenceId) {
    const matched = candidates.find(c => c.id === target.occurrenceId);
    return {
      occurrence: matched ?? null,
      candidates,
      selection: matched ? 'selected' : 'unavailable',
    };
  }

  // If the caller explicitly supplied a variantKey, check if it matched
  if (target.variantKey) {
    const matched = candidates.find(c => c.variantKey === target.variantKey);
    return {
      occurrence: matched ?? null,
      candidates,
      selection: matched ? 'selected' : 'unavailable',
    };
  }

  if (candidates.length === 1) {
    return {
      occurrence: candidates[0],
      candidates,
      selection: 'selected',
    };
  }

  // Multiple candidates exist (e.g. Smartha and Vaishnava on different or same days).
  // Calendar Engineering Rule 7: Never silently choose between recognised traditions.
  // Return selection='multiple' with all candidates and point occurrence to the primary variant.
  const primary = candidates.find(row => row.isPrimary) ?? candidates[0];
  return {
    occurrence: primary,
    candidates,
    selection: 'multiple',
  };
}
