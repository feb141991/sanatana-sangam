/**
 * Pure governance check shared by calendar audit scripts and unit tests.
 * A definition whose only rule state is `deferred` must not have a published
 * occurrence that passes the same read-time policy used by calendar APIs.
 * Occurrence rows are filtered before calling this helper so exact approved
 * fixture exceptions are not misreported as user-visible publication leaks.
 */
export interface PublishedOccurrenceForRuleAudit {
  date: string;
}

export interface DeferredPublicationGap {
  publishedCount: number;
  publishedDates: string[];
  note: string;
}

export function findDeferredPublishedGap(
  launchStatuses: readonly string[] | null | undefined,
  publishedOccurrences: readonly PublishedOccurrenceForRuleAudit[],
): DeferredPublicationGap | null {
  const statuses = [...new Set(launchStatuses ?? [])];
  if (statuses.length !== 1 || statuses[0] !== 'deferred' || publishedOccurrences.length === 0) return null;

  const publishedDates = [...new Set(publishedOccurrences.map(row => row.date))].sort();
  return {
    publishedCount: publishedOccurrences.length,
    publishedDates,
    note: `GOVERNANCE GAP: this rule is launch_status:'deferred', yet ${publishedOccurrences.length} stored published occurrence row(s) pass the current calendar read-time gate.`,
  };
}
