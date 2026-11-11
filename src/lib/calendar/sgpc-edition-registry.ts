import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import slugMap from '../../../docs/sources/sgpc-nanakshahi-slug-map.json';

export type SgpcSidebarRow = {
  index: number;
  day: string;
  month: string;
  name_gurmukhi?: string;
};

export type SgpcEdition = {
  edition: number;
  from: string;
  to: string;
  monthStarts: Record<string, string>;
  rows: SgpcSidebarRow[];
};

type EditionFile = {
  edition: number;
  edition_range: { from: string; to: string };
  month_starts?: Record<string, string>;
  rows: SgpcSidebarRow[];
};

type SlugMapEntry = { slug: string; name_includes: string[] };

const sourceDirectory = join(process.cwd(), 'docs', 'sources');
const slugMappings = slugMap as SlugMapEntry[];

function loadEditionFiles(): SgpcEdition[] {
  let filenames: string[];
  try {
    filenames = readdirSync(sourceDirectory);
  } catch {
    return [];
  }

  return filenames
    .map(filename => ({ filename, match: /^sgpc-nanakshahi-(\d+)-sidebar\.json$/.exec(filename) }))
    .filter((entry): entry is { filename: string; match: RegExpExecArray } => Boolean(entry.match))
    .map(({ filename }) => {
      try {
        const parsed = JSON.parse(readFileSync(join(sourceDirectory, filename), 'utf8')) as EditionFile;
        if (!parsed.edition || !parsed.edition_range?.from || !parsed.edition_range?.to || !parsed.month_starts) return null;
        return {
          edition: parsed.edition,
          from: parsed.edition_range.from,
          to: parsed.edition_range.to,
          monthStarts: parsed.month_starts,
          rows: parsed.rows,
        } satisfies SgpcEdition;
      } catch {
        return null;
      }
    })
    .filter((edition): edition is SgpcEdition => edition !== null)
    .sort((a, b) => a.edition - b.edition);
}

export const SGPC_EDITIONS = loadEditionFiles();

export function findMappedSidebarRow(edition: SgpcEdition, slug: string): SgpcSidebarRow | null {
  const mapping = slugMappings.find(entry => entry.slug === slug);
  if (!mapping) return null;
  return edition.rows.find(row => mapping.name_includes.every(fragment => (row.name_gurmukhi ?? '').includes(fragment))) ?? null;
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function dateForEditionRow(edition: SgpcEdition, row: SgpcSidebarRow, targetYear = Number(edition.from.slice(0, 4))): string | null {
  const monthStart = edition.monthStarts[row.month];
  if (!monthStart || !/^\d{1,2}(?:-\d{1,2})?$/.test(row.day)) return null;
  const start = new Date(monthStart);
  const target = `${targetYear}-${String(start.getUTCMonth() + 1).padStart(2, '0')}-${String(start.getUTCDate()).padStart(2, '0')}`;
  return addDays(target, Number(row.day.split('-')[0]) - 1);
}

export function editionForDate(date: string, editions: readonly SgpcEdition[] = SGPC_EDITIONS): SgpcEdition | null {
  return editions.find(edition => date >= edition.from && date <= edition.to) ?? null;
}

export function latestEdition(): SgpcEdition | null {
  return SGPC_EDITIONS[SGPC_EDITIONS.length - 1] ?? null;
}

export function mappedDateForEdition(edition: SgpcEdition, slug: string, targetYear: number): string | null {
  const row = findMappedSidebarRow(edition, slug);
  return row ? dateForEditionRow(edition, row, targetYear) : null;
}
