import type { ClientObservanceResult } from './observance-formatter';

/**
 * Calendar results retain alternatives for governance and diagnostics. Home
 * needs one card per real observance instance, not one card per stored row.
 */
export function selectDisplayObservances(results: ClientObservanceResult[]): ClientObservanceResult[] {
  const publishable = results.filter(
    (result) => result.status === 'resolved' && Boolean(result.civilDate),
  );
  const selected = new Map<string, ClientObservanceResult>();

  for (const result of publishable) {
    const key = `${result.festivalId}:${result.civilDate}`;
    const current = selected.get(key);
    if (!current || (!current.isPrimary && result.isPrimary)) selected.set(key, result);
  }

  return [...selected.values()].sort((a, b) =>
    (a.civilDate ?? '').localeCompare(b.civilDate ?? '') || a.display_name.localeCompare(b.display_name),
  );
}
