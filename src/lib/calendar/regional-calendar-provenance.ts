export type CalendarDateProvenance =
  | {
      provenance: 'sgpc_edition';
      edition: 558;
      disagreementDays?: number;
      reason?: string;
    }
  | {
      provenance: 'computed_expected' | 'approximate' | 'unavailable';
      edition: null;
      disagreementDays?: number;
      reason: string;
    };

export type RegionalCalendarDateResult = {
  date: string;
  calendarProvenance: CalendarDateProvenance;
};

const SGPC_558_RANGE = { from: '2026-03-14', to: '2027-03-13' } as const;

const SGPC_558_DATES_BY_SLUG: Record<string, string> = {
  'guru-amar-das-gurpurab': '2026-04-30',
  'guru-arjan-dev-martyrdom': '2026-06-18',
  'guru-har-krishan-gurpurab': '2026-08-07',
  'guru-ram-das-gurpurab': '2026-10-27',
  'guru-tegh-bahadur-martyrdom': '2026-12-14',
  'guru-gobind-singh-gurpurab': '2027-01-15',
};

export function isInsideSgpc558(date: string) {
  return date >= SGPC_558_RANGE.from && date <= SGPC_558_RANGE.to;
}

export function regionalCalendarProvenanceFor(
  slug: string,
  date: string,
): { calendar_provenance?: CalendarDateProvenance } {
  if (!Object.prototype.hasOwnProperty.call(SGPC_558_DATES_BY_SLUG, slug)) return {};
  const printedDate = SGPC_558_DATES_BY_SLUG[slug];
  if (date === printedDate && isInsideSgpc558(date)) {
    return {
      calendar_provenance: {
        provenance: 'sgpc_edition',
        edition: 558,
      },
    };
  }
  return {
    calendar_provenance: {
      provenance: 'computed_expected',
      edition: null,
      reason: 'Computed from the Nanakshahi month/day anchor; the matching SGPC 558 printed date was not used.',
    },
  };
}

export function parseCalendarProvenance(source: unknown): CalendarDateProvenance | null {
  const value = source && typeof source === 'object' && 'calendar_provenance' in source
    ? (source as { calendar_provenance?: unknown }).calendar_provenance
    : source;
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (candidate.provenance === 'sgpc_edition' && candidate.edition === 558) {
    return {
      provenance: 'sgpc_edition',
      edition: 558,
      ...(typeof candidate.disagreementDays === 'number' ? { disagreementDays: candidate.disagreementDays } : {}),
      ...(typeof candidate.reason === 'string' ? { reason: candidate.reason } : {}),
    };
  }
  if (
    (candidate.provenance === 'computed_expected' || candidate.provenance === 'approximate' || candidate.provenance === 'unavailable')
    && candidate.edition === null
    && typeof candidate.reason === 'string'
  ) {
    return {
      provenance: candidate.provenance,
      edition: null,
      ...(typeof candidate.disagreementDays === 'number' ? { disagreementDays: candidate.disagreementDays } : {}),
      reason: candidate.reason,
    };
  }
  return null;
}

export function isRegionalCalendarOccurrence(row: any): boolean {
  const def = Array.isArray(row?.observance_definitions)
    ? row.observance_definitions[0]
    : row?.observance_definitions;
  return def?.verification_type === 'regional_calendar'
    || def?.rule_family === 'regional_calendar'
    || row?.verification_type === 'regional_calendar'
    || row?.calendarProvenance?.provenance != null
    || row?.calendar_provenance?.provenance != null
    || (row?.spiritual_tradition === 'sikh' && row?.calendar_profile === 'nanakshahi');
}

export function isFinalCalendarDate(row: any): boolean {
  if (!isRegionalCalendarOccurrence(row)) return true;
  const effectiveDate = row?.manual_date_override ?? row?.date;
  if (typeof effectiveDate !== 'string' || !isInsideSgpc558(effectiveDate)) return false;
  return parseCalendarProvenance(row?.source_provenance ?? row?.calendarProvenance ?? row?.calendar_provenance)?.provenance === 'sgpc_edition';
}
