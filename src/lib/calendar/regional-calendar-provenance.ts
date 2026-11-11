import sidebarData from '../../../docs/sources/sgpc-nanakshahi-558-sidebar.json';

export type CalendarDateProvenance =
  | { provenance: 'sgpc_edition'; edition: 558; disagreementDays?: number; reason?: string }
  | { provenance: 'computed_expected' | 'approximate' | 'unavailable' | 'cultural_convention'; edition: null; disagreementDays?: number; reason: string };

export type RegionalCalendarDateResult = { date: string; calendarProvenance: CalendarDateProvenance };

export const SGPC_558_RANGE = { from: '2026-03-14', to: '2027-03-13' } as const;

/** Month starts read from the committed SGPC 558 source manifest. */
export const SGPC_558_MONTH_STARTS = {
  Chet: '2026-03-14', Vaisakh: '2026-04-14', Jeth: '2026-05-15', Harh: '2026-06-15',
  Sawan: '2026-07-16', Bhadon: '2026-08-17', Assu: '2026-09-17', Katak: '2026-10-17',
  Maghar: '2026-11-16', Poh: '2026-12-16', Magh: '2027-01-14', Phagun: '2027-02-13',
} as const;

type SidebarRow = { index: number; day: string; month: keyof typeof SGPC_558_MONTH_STARTS };

/** Reviewed mapping to the committed 108-row SGPC sidebar. */
export const SGPC_558_SLUG_TO_SIDEBAR_ROW: Record<string, SidebarRow> = {
  baisakhi: { index: 16, day: '1', month: 'Vaisakh' },
  'guru-nanak-gurpurab': { index: 78, day: '9', month: 'Maghar' },
  'bandhi-chhor-divas': { index: 71, day: '23', month: 'Katak' },
  'guru-tegh-bahadur-martyrdom': { index: 84, day: '29', month: 'Maghar' },
  'guru-gobind-singh-gurpurab': { index: 96, day: '2', month: 'Magh' },
  'guru-ravidas-jayanti': { index: 104, day: '8', month: 'Phagun' },
  'guru-arjan-dev-martyrdom': { index: 30, day: '4', month: 'Harh' },
  'guru-amar-das-gurpurab': { index: 19, day: '17', month: 'Vaisakh' },
  'guru-ram-das-gurpurab': { index: 64, day: '11', month: 'Katak' },
  'guru-har-krishan-gurpurab': { index: 41, day: '23', month: 'Sawan' },
  'sahibzade-elder-shaheedi-diwas': { index: 108, day: '8', month: 'Poh' },
  'sahibzade-younger-shaheedi-diwas': { index: 92, day: '13', month: 'Poh' },
};

const CULTURAL_CONVENTION_SLUGS = new Set(['lohri']);
const SIKH_SLUGS = new Set([...Object.keys(SGPC_558_SLUG_TO_SIDEBAR_ROW), 'holla-mohalla', 'sahibzade-shaheedi-diwas', 'lohri']);
const SIDEBAR_ROWS = sidebarData.rows as Array<{ index: number; day: string; month: string }>;

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function dateFromSidebarRow(row: SidebarRow): string {
  return addDays(SGPC_558_MONTH_STARTS[row.month], Number(row.day) - 1);
}

export const SGPC_558_DATES_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SGPC_558_SLUG_TO_SIDEBAR_ROW).map(([slug, row]) => [slug, dateFromSidebarRow(row)]),
);

export function assertSgpcMappingRows() {
  for (const [slug, mapping] of Object.entries(SGPC_558_SLUG_TO_SIDEBAR_ROW)) {
    const row = SIDEBAR_ROWS.find(candidate => candidate.index === mapping.index);
    if (!row || row.day !== mapping.day || row.month !== mapping.month) {
      throw new Error(`SGPC 558 mapping mismatch for ${slug}: sidebar row ${mapping.index}`);
    }
  }
}

assertSgpcMappingRows();

export function isInsideSgpc558(date: string) {
  return date >= SGPC_558_RANGE.from && date <= SGPC_558_RANGE.to;
}

export function regionalCalendarProvenanceFor(slug: string, date: string): { calendar_provenance?: CalendarDateProvenance } {
  if (CULTURAL_CONVENTION_SLUGS.has(slug)) {
    return { calendar_provenance: { provenance: 'cultural_convention', edition: null, reason: 'Lohri is a Punjabi cultural convention and is absent from SGPC editions 557 and 558; it is not an SGPC date.' } };
  }
  if (slug === 'holla-mohalla') {
    return { calendar_provenance: { provenance: 'approximate', edition: null, reason: 'Holla Mohalla is derived as Holi plus one civil day; it falls outside the SGPC 558 coverage window.' } };
  }
  const printedDate = SGPC_558_DATES_BY_SLUG[slug];
  if (!printedDate) {
    return SIKH_SLUGS.has(slug)
      ? { calendar_provenance: { provenance: 'unavailable', edition: null, reason: 'No reviewed SGPC 558 sidebar identity or approved calculation method is available.' } }
      : {};
  }
  if (date === printedDate && isInsideSgpc558(date)) return { calendar_provenance: { provenance: 'sgpc_edition', edition: 558 } };
  return { calendar_provenance: { provenance: 'approximate', edition: null, reason: 'Date comes from the fixed Nanakshahi table outside the matching SGPC 558 printed date and may differ by weeks.' } };
}

export function parseCalendarProvenance(source: unknown): CalendarDateProvenance | null {
  const value = source && typeof source === 'object' && 'calendar_provenance' in source
    ? (source as { calendar_provenance?: unknown }).calendar_provenance : source;
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (candidate.provenance === 'sgpc_edition' && candidate.edition === 558) {
    return { provenance: 'sgpc_edition', edition: 558,
      ...(typeof candidate.disagreementDays === 'number' ? { disagreementDays: candidate.disagreementDays } : {}),
      ...(typeof candidate.reason === 'string' ? { reason: candidate.reason } : {}) };
  }
  if ((candidate.provenance === 'computed_expected' || candidate.provenance === 'approximate' || candidate.provenance === 'unavailable' || candidate.provenance === 'cultural_convention') && candidate.edition === null && typeof candidate.reason === 'string') {
    return { provenance: candidate.provenance, edition: null,
      ...(typeof candidate.disagreementDays === 'number' ? { disagreementDays: candidate.disagreementDays } : {}), reason: candidate.reason };
  }
  return null;
}

export function isRegionalCalendarOccurrence(row: any): boolean {
  const def = Array.isArray(row?.observance_definitions) ? row.observance_definitions[0] : row?.observance_definitions;
  const slug = def?.slug ?? row?.slug;
  if (CULTURAL_CONVENTION_SLUGS.has(slug)) return false;
  return def?.tradition === 'sikh' || row?.tradition === 'sikh' || row?.spiritual_tradition === 'sikh'
    || SIKH_SLUGS.has(slug) || def?.verification_type === 'regional_calendar'
    || def?.rule_family === 'regional_calendar' || row?.verification_type === 'regional_calendar'
    || row?.calendarProvenance?.provenance != null || row?.calendar_provenance?.provenance != null
    || row?.calendar_profile === 'nanakshahi';
}

export function isFinalCalendarDate(row: any): boolean {
  if (!isRegionalCalendarOccurrence(row)) return true;
  const effectiveDate = row?.manual_date_override ?? row?.date;
  if (typeof effectiveDate !== 'string' || !isInsideSgpc558(effectiveDate)) return false;
  return parseCalendarProvenance(row?.source_provenance ?? row?.calendarProvenance ?? row?.calendar_provenance)?.provenance === 'sgpc_edition';
}
