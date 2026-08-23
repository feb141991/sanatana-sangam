import { createHash } from 'node:crypto';
import type { SourceReference } from '@sangam/dharma-rules';
import seriesDefinitionsJson from '@sangam/dharma-rules/src/festivals/series.json';
import seriesContentJson from '@sangam/dharma-rules/src/festivals/series-content.json';
import {
  OBSERVANCE_SERIES_CONTRACT_VERSION,
  type LocalizedEditorialField,
  type ObservanceSeries,
  type ObservanceSeriesChild,
  type ObservanceSeriesMode,
  type ObservanceSeriesSourceReference,
  type ObservanceSeriesStatus,
} from '../../../contracts/observance-series-contract';
import type { ClientObservanceResult } from './observance-formatter';

export interface SeriesDefinitionChild {
  slug: string;
  sequence: number;
  title: string;
  deityOrTheme?: string;
  rituals?: string[];
}

export interface SeriesDefinition {
  definitionKey: string;
  version: string;
  mode: ObservanceSeriesMode;
  name: string;
  tradition: string;
  anchorSlug: string;
  allowCrossYear: boolean;
  children: SeriesDefinitionChild[];
}

export interface BuildObservanceSeriesOptions {
  spiritualDate: string;
  profile: { calendar: string; tradition: string };
  location: { label: string; lat: number; lon: number; tz: string };
  tradition: string;
}

const SERIES_DEFINITIONS = seriesDefinitionsJson as SeriesDefinition[];

export function assertSeriesDefinitions(definitions: SeriesDefinition[]): void {
  const definitionKeys = new Set<string>();
  for (const definition of definitions) {
    if (definitionKeys.has(definition.definitionKey)) throw new Error(`Duplicate series definition: ${definition.definitionKey}`);
    definitionKeys.add(definition.definitionKey);
    const sequences = new Set<number>();
    const slugs = new Set<string>();
    for (const child of definition.children) {
      if (sequences.has(child.sequence)) throw new Error(`Duplicate sequence in ${definition.definitionKey}: ${child.sequence}`);
      if (slugs.has(child.slug)) throw new Error(`Duplicate child in ${definition.definitionKey}: ${child.slug}`);
      sequences.add(child.sequence);
      slugs.add(child.slug);
    }
  }
}

assertSeriesDefinitions(SERIES_DEFINITIONS);

export interface SourcedSeriesChildContent {
  slug: string;
  sequence: number;
  canonicalTitle: LocalizedEditorialField<{ en: string; hi?: string; pa?: string }>;
  deityOrTheme?: LocalizedEditorialField<{ en: string; hi?: string; pa?: string }>;
  rituals?: LocalizedEditorialField<{ en: string[]; hi?: string[]; pa?: string[] }>;
  significance?: LocalizedEditorialField<{ en: string; hi?: string; pa?: string }>;
}

export interface SourcedSeriesGroupContent {
  definitionKey: string;
  name: LocalizedEditorialField<{ en: string; hi?: string; pa?: string }>;
  tradition: string;
  children: SourcedSeriesChildContent[];
}

const SERIES_CONTENT_DATA = seriesContentJson as { version: string; series: SourcedSeriesGroupContent[] };
const SERIES_CONTENT_BY_SLUG = new Map<string, SourcedSeriesChildContent>();
for (const s of SERIES_CONTENT_DATA.series) {
  for (const child of s.children) {
    SERIES_CONTENT_BY_SLUG.set(child.slug, child);
  }
}


function sameLocation(result: ClientObservanceResult, location: BuildObservanceSeriesOptions['location']): boolean {
  return result.location.tz === location.tz
    && result.location.lat.toFixed(4) === location.lat.toFixed(4)
    && result.location.lon.toFixed(4) === location.lon.toFixed(4);
}

function sourceKey(source: ObservanceSeriesSourceReference): string {
  return JSON.stringify([
    source.sourceName,
    source.textName ?? null,
    source.publisher ?? null,
    source.edition ?? null,
    source.pageOrSection ?? null,
    source.tier,
    source.url ?? null,
  ]);
}

function dedupeSources(sources: SourceReference[][]): ObservanceSeriesSourceReference[] {
  const unique = new Map<string, ObservanceSeriesSourceReference>();
  for (const source of sources.flat()) unique.set(sourceKey(source), source);
  return [...unique.values()];
}

export function buildObservanceSeriesKey(
  definition: SeriesDefinition,
  year: string,
  options: BuildObservanceSeriesOptions,
): string {
  const canonical = [
    definition.definitionKey,
    definition.version,
    year,
    options.profile.calendar,
    options.profile.tradition,
    options.location.lat.toFixed(4),
    options.location.lon.toFixed(4),
    options.location.tz,
  ].join('|');
  return createHash('sha256').update(canonical).digest('hex').slice(0, 32);
}

function temporalStatus(
  spiritualDate: string,
  startDate: string | null,
  endDate: string | null,
  currentDay: number | null,
  totalDays: number,
): ObservanceSeriesStatus {
  if (!startDate || !endDate) return 'under_review';
  if (spiritualDate < startDate) return 'upcoming';
  if (spiritualDate > endDate) return 'complete';
  if (currentDay === totalDays) return 'concluding';
  return 'active';
}

function resultYear(result: ClientObservanceResult): string | null {
  const date = result.civilDate ?? result.reviewPlacementDate;
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.slice(0, 4) : null;
}

function buildOneSeries(
  definition: SeriesDefinition,
  year: string,
  results: ClientObservanceResult[],
  options: BuildObservanceSeriesOptions,
): ObservanceSeries {
  const diagnostics: string[] = [];
  const children: ObservanceSeriesChild[] = [];
  const profileMatches = (result: ClientObservanceResult) =>
    result.profile.calendar === options.profile.calendar
    && result.profile.tradition === options.profile.tradition
    && sameLocation(result, options.location);

  for (const childDefinition of definition.children) {
    const allSlugRows = results.filter(result => result.slug === childDefinition.slug);
    const contextualRows = allSlugRows.filter(profileMatches);
    const sameYearRows = contextualRows.filter(result => resultYear(result) === year);
    const candidates = sameYearRows.length > 0
      ? sameYearRows
      : contextualRows.length === 1
        ? contextualRows
        : [];
    const primaryRows = candidates.filter(result => result.isPrimary);
    const selected = primaryRows.length === 1
      ? primaryRows[0]
      : candidates.length === 1
        ? candidates[0]
        : null;

    if (allSlugRows.length > 0 && contextualRows.length === 0) diagnostics.push(`series_context_mismatch:${childDefinition.slug}`);
    if (candidates.length > 1) diagnostics.push(`duplicate_series_child:${childDefinition.slug}`);
    if (primaryRows.length > 1) diagnostics.push(`multiple_primary_series_child:${childDefinition.slug}`);

    if (!selected) {
      diagnostics.push(`missing_required_series_child:${childDefinition.slug}`);
      children.push({
        occurrenceId: null,
        slug: childDefinition.slug,
        civilDate: null,
        sequence: childDefinition.sequence,
        title: childDefinition.title,
        routeKind: null,
        routeSlug: null,
        status: 'missing',
        diagnostics: ['required_series_child_missing'],
        sourceRefs: [],
        editorial: (() => {
          const c = SERIES_CONTENT_BY_SLUG.get(childDefinition.slug);
          return c ? {
            canonicalTitle: c.canonicalTitle,
            deityOrTheme: c.deityOrTheme ?? null,
            rituals: c.rituals,
            significance: c.significance ?? null,
          } : undefined;
        })(),
      });
      continue;
    }

    const childDiagnostics = [...selected.diagnostics];
    if (selected.status !== 'resolved' || selected.reviewStatus !== 'reviewed') {
      childDiagnostics.push('series_child_not_final');
      diagnostics.push(`series_child_under_review:${childDefinition.slug}`);
    }
    children.push({
      occurrenceId: selected.id ?? null,
      slug: selected.slug,
      civilDate: selected.civilDate,
      sequence: childDefinition.sequence,
      title: childDefinition.title,
      routeKind: selected.route_kind,
      routeSlug: selected.route_slug,
      status: selected.status,
      diagnostics: [...new Set(childDiagnostics)],
      sourceRefs: selected.sourceRefs,
      editorial: (() => {
        const c = SERIES_CONTENT_BY_SLUG.get(childDefinition.slug);
        return c ? {
          canonicalTitle: c.canonicalTitle,
          deityOrTheme: c.deityOrTheme ?? null,
          rituals: c.rituals,
          significance: c.significance ?? null,
        } : undefined;
      })(),
    });
  }

  children.sort((a, b) => a.sequence - b.sequence);
  const resolvedDates = children.flatMap(child => child.civilDate ? [child.civilDate] : []).sort();
  const representedYears = new Set(resolvedDates.map(date => date.slice(0, 4)));
  if (!definition.allowCrossYear && representedYears.size > 1) diagnostics.push('series_crosses_civil_year');

  const todayChildren = children.filter(child => child.civilDate === options.spiritualDate);
  if (todayChildren.length > 1) diagnostics.push('multiple_series_children_today');
  const activeChildOccurrenceIds = todayChildren.flatMap(child => child.occurrenceId ? [child.occurrenceId] : []);
  const currentCivilDate = todayChildren.length > 0 ? options.spiritualDate : null;
  const currentDay = todayChildren.length > 0
    ? Math.min(...todayChildren.map(child => child.sequence))
    : null;
  const startDate = resolvedDates[0] ?? null;
  const endDate = resolvedDates[resolvedDates.length - 1] ?? null;
  const hasIntegrityFailure = diagnostics.some(code =>
    code.startsWith('missing_required_series_child:')
    || code.startsWith('duplicate_series_child:')
    || code.startsWith('multiple_primary_series_child:')
    || code.startsWith('series_context_mismatch:')
    || code.startsWith('series_child_under_review:')
    || code === 'series_crosses_civil_year'
  );
  const status = hasIntegrityFailure
    ? 'under_review'
    : temporalStatus(options.spiritualDate, startDate, endDate, currentDay, children.length);
  const versions: Record<string, string> = {
    contract: OBSERVANCE_SERIES_CONTRACT_VERSION,
    seriesDefinition: definition.version,
  };
  for (const child of children) {
    const result = results.find(candidate => candidate.id === child.occurrenceId);
    if (!result) continue;
    for (const [key, value] of Object.entries(result.versions)) versions[`${child.slug}.${key}`] = value;
  }

  return {
    seriesKey: buildObservanceSeriesKey(definition, year, options),
    definitionKey: definition.definitionKey,
    mode: definition.mode,
    name: definition.name,
    tradition: definition.tradition,
    profile: options.profile,
    location: options.location,
    status,
    startDate,
    endDate,
    currentCivilDate,
    activeChildOccurrenceIds,
    currentDay,
    totalDays: children.length,
    children,
    diagnostics: [...new Set(diagnostics)],
    sourceRefs: dedupeSources(children.map(child => child.sourceRefs)),
    versions,
  };
}

/**
 * Derives parent series losslessly from versioned membership plus canonical
 * child occurrences. No parent persistence is needed: child identities remain
 * authoritative and the versioned definition participates in the stable key.
 */
export function buildObservanceSeries(
  results: ClientObservanceResult[],
  options: BuildObservanceSeriesOptions,
): ObservanceSeries[] {
  const output: ObservanceSeries[] = [];
  for (const definition of SERIES_DEFINITIONS) {
    const childSlugs = new Set(definition.children.map(child => child.slug));
    const relevant = results.filter(result => childSlugs.has(result.slug));
    if (relevant.length === 0) continue;
    const years = [...new Set(relevant.map(resultYear).filter((year): year is string => year !== null))].sort();
    for (const year of years) output.push(buildOneSeries(definition, year, results, options));
  }
  return output.sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));
}

export { SERIES_DEFINITIONS };
