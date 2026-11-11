import { editionForDate, findMappedSidebarRow, latestEdition, mappedDateForEdition, SGPC_EDITIONS, type SgpcEdition } from './sgpc-edition-registry';

export type CalendarDateProvenance =
  | { provenance: 'sgpc_edition'; edition: number; disagreementDays?: number; reason?: string }
  | { provenance: 'cultural_convention'; edition: null; reason: string };

export type RegionalCalendarDateResult = { date: string; calendarProvenance: CalendarDateProvenance };

const CULTURAL_CONVENTION_SLUGS = new Set(['lohri', 'sahibzade-shaheedi-diwas']);
const SIKH_SLUGS = new Set(['baisakhi', 'guru-nanak-gurpurab', 'bandhi-chhor-divas', 'guru-tegh-bahadur-martyrdom', 'guru-gobind-singh-gurpurab', 'guru-ravidas-jayanti', 'guru-arjan-dev-martyrdom', 'guru-amar-das-gurpurab', 'guru-ram-das-gurpurab', 'guru-har-krishan-gurpurab', 'sahibzade-elder-shaheedi-diwas', 'sahibzade-younger-shaheedi-diwas', 'holla-mohalla', 'sahibzade-shaheedi-diwas', 'lohri']);

export function isInsideEdition(date: string, edition: { from: string; to: string }) {
  return date >= edition.from && date <= edition.to;
}

export function regionalCalendarProvenanceFor(slug: string, date: string, editions: readonly SgpcEdition[] = SGPC_EDITIONS): { calendar_provenance?: CalendarDateProvenance } {
  if (CULTURAL_CONVENTION_SLUGS.has(slug)) {
    const reason = slug === 'lohri'
      ? 'Lohri is a Punjabi cultural convention and is not an SGPC sidebar entry.'
      : 'This legacy Sahibzade observance remains a cultural convention pending council direction.';
    return { calendar_provenance: { provenance: 'cultural_convention', edition: null, reason } };
  }
  if (slug === 'holla-mohalla') {
    return {};
  }

  const targetYear = Number(date.slice(0, 4));
  const coveringEdition = editionForDate(date, editions);
  if (coveringEdition) {
    const row = findMappedSidebarRow(coveringEdition, slug);
    if (row && mappedDateForEdition(coveringEdition, slug, targetYear) === date) {
      return { calendar_provenance: { provenance: 'sgpc_edition', edition: coveringEdition.edition } };
    }
  }

  return {};
}

export function parseCalendarProvenance(source: unknown): CalendarDateProvenance | null {
  const value = source && typeof source === 'object' && 'calendar_provenance' in source
    ? (source as { calendar_provenance?: unknown }).calendar_provenance : source;
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (candidate.provenance === 'sgpc_edition' && typeof candidate.edition === 'number' && Number.isInteger(candidate.edition) && candidate.edition > 0) {
    return { provenance: 'sgpc_edition', edition: candidate.edition,
      ...(typeof candidate.disagreementDays === 'number' ? { disagreementDays: candidate.disagreementDays } : {}),
      ...(typeof candidate.reason === 'string' ? { reason: candidate.reason } : {}) };
  }
  if (candidate.provenance === 'cultural_convention' && candidate.edition === null && typeof candidate.reason === 'string') {
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
  if (typeof effectiveDate !== 'string') return false;
  const edition = editionForDate(effectiveDate);
  return Boolean(edition && parseCalendarProvenance(row?.source_provenance ?? row?.calendarProvenance ?? row?.calendar_provenance)?.provenance === 'sgpc_edition');
}

export { SGPC_EDITIONS, editionForDate, findMappedSidebarRow, latestEdition, mappedDateForEdition };
