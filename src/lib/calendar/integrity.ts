import { calculateObservanceCandidateDiagnosticsForYear } from './engine';

type ObservanceDefinitionJoin = {
  slug: string;
  display_name?: string | null;
  kind?: string | null;
  tradition?: string | null;
  active?: boolean | null;
};

export type CalendarIntegrityRow = {
  id: string;
  date: string;
  year: number;
  final_date_source: string | null;
  manual_date_override: string | null;
  locked_for_regeneration: boolean | null;
  source_provenance: unknown;
  review_status: string | null;
  verification_status: string | null;
  verification_confidence: string | null;
  observance_definitions: ObservanceDefinitionJoin | ObservanceDefinitionJoin[] | null;
};

export type CalendarIntegrityIssue = {
  slug: string;
  displayName: string;
  year: number;
  storedDate?: string | null;
  engineDate?: string | null;
  candidateDates?: string[];
  reason: string;
};

export type CalendarIntegrityReport = {
  years: number[];
  checkedRows: number;
  verifiedMatch: number;
  protectedManualOverride: number;
  missingExternalSource: CalendarIntegrityIssue[];
  engineCuratedMismatch: CalendarIntegrityIssue[];
  multipleCandidatesNeedsReview: CalendarIntegrityIssue[];
  unreviewedOrNotVerified: CalendarIntegrityIssue[];
  issueCount: number;
};

function getDefinition(row: CalendarIntegrityRow): ObservanceDefinitionJoin | null {
  if (Array.isArray(row.observance_definitions)) {
    return row.observance_definitions[0] ?? null;
  }
  return row.observance_definitions;
}

function getSourceKind(source: unknown): string | null {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return null;
  const value = (source as { source_kind?: unknown }).source_kind;
  return typeof value === 'string' ? value : null;
}

function isCurated(row: CalendarIntegrityRow): boolean {
  return getSourceKind(row.source_provenance) === 'curated';
}

function isProtectedManual(row: CalendarIntegrityRow): boolean {
  return row.final_date_source === 'manual_override'
    || Boolean(row.manual_date_override)
    || Boolean(row.locked_for_regeneration);
}

function isLaunchCritical(row: CalendarIntegrityRow): boolean {
  const def = getDefinition(row);
  return def?.kind !== 'vrat';
}

function issueFor(row: CalendarIntegrityRow, reason: string, engineDate?: string | null, candidateDates?: string[]): CalendarIntegrityIssue {
  const def = getDefinition(row);
  return {
    slug: def?.slug ?? 'unknown',
    displayName: def?.display_name ?? def?.slug ?? 'Unknown observance',
    year: row.year,
    storedDate: row.date,
    engineDate,
    candidateDates,
    reason,
  };
}

export function buildCalendarIntegrityReport(
  rows: CalendarIntegrityRow[],
  years: number[],
): CalendarIntegrityReport {
  const yearSet = new Set(years);
  const relevantRows = rows.filter((row) => yearSet.has(row.year));
  const diagnostics = new Map<string, ReturnType<typeof calculateObservanceCandidateDiagnosticsForYear>[number]>();

  for (const year of years) {
    for (const diagnostic of calculateObservanceCandidateDiagnosticsForYear(year)) {
      diagnostics.set(`${diagnostic.slug}:${year}`, diagnostic);
    }
  }

  const missingExternalSource: CalendarIntegrityIssue[] = [];
  const engineCuratedMismatch: CalendarIntegrityIssue[] = [];
  const multipleCandidatesNeedsReview: CalendarIntegrityIssue[] = [];
  const unreviewedOrNotVerified: CalendarIntegrityIssue[] = [];
  let verifiedMatch = 0;
  let protectedManualOverride = 0;

  for (const row of relevantRows) {
    const def = getDefinition(row);
    if (!def?.slug) continue;
    const diagnostic = diagnostics.get(`${def.slug}:${row.year}`);
    const curated = isCurated(row);
    const protectedManual = isProtectedManual(row);
    const isReviewed = row.review_status === 'reviewed';
    const isVerified = row.verification_status === 'verified';

    if (protectedManual) {
      protectedManualOverride += 1;
    }

    if (isLaunchCritical(row) && !curated && !protectedManual) {
      missingExternalSource.push(issueFor(row, 'No curated source provenance or manual override protection.'));
    }

    if (
      curated
      && diagnostic?.selectedDate
      && row.date !== diagnostic.selectedDate
      && !protectedManual
    ) {
      engineCuratedMismatch.push(issueFor(
        row,
        'Curated stored date differs from deterministic engine date and is not protected as a manual override.',
        diagnostic.selectedDate,
        diagnostic.candidateDates,
      ));
    }

    if (
      isLaunchCritical(row)
      && diagnostic
      && !diagnostic.recurring
      && diagnostic.candidateCount > 1
      && !protectedManual
    ) {
      multipleCandidatesNeedsReview.push(issueFor(
        row,
        'Engine produced multiple candidate dates; row needs explicit review/protection.',
        diagnostic.selectedDate,
        diagnostic.candidateDates,
      ));
    }

    if (isLaunchCritical(row) && (!isReviewed || !isVerified)) {
      unreviewedOrNotVerified.push(issueFor(row, 'Row is not both reviewed and verified.'));
    }

    if (
      curated
      && isReviewed
      && isVerified
      && (!diagnostic?.selectedDate || row.date === diagnostic.selectedDate || protectedManual)
    ) {
      verifiedMatch += 1;
    }
  }

  const issueCount = missingExternalSource.length
    + engineCuratedMismatch.length
    + multipleCandidatesNeedsReview.length
    + unreviewedOrNotVerified.length;

  return {
    years,
    checkedRows: relevantRows.length,
    verifiedMatch,
    protectedManualOverride,
    missingExternalSource,
    engineCuratedMismatch,
    multipleCandidatesNeedsReview,
    unreviewedOrNotVerified,
    issueCount,
  };
}
