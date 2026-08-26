import festivalContentJson from '../../packages/dharma-rules/src/festivals/festival-content.json';
import { isEditorialFieldDisplayable } from '@/lib/calendar/series-card-helpers';
import type { LocalizedEditorialField } from '../../contracts/observance-series-contract';

export interface FestivalMantraContent {
  sanskrit: string;
  transliteration: string;
  translation: LocalizedEditorialField<{ en: string; hi?: string; pa?: string }>;
}

export interface FestivalContent {
  definitionKey: string;
  emoji: string;
  tradition: string;
  name: LocalizedEditorialField<{ en: string; hi?: string; pa?: string }>;
  tagline: LocalizedEditorialField<{ en: string; hi?: string; pa?: string }>;
  significance: LocalizedEditorialField<{ en: string; hi?: string; pa?: string }>;
  rituals: LocalizedEditorialField<{ en: string[]; hi?: string[]; pa?: string[] }>;
  dos?: LocalizedEditorialField<{ en: string[]; hi?: string[]; pa?: string[] }>;
  donts?: LocalizedEditorialField<{ en: string[]; hi?: string[]; pa?: string[] }>;
  pujaItems?: LocalizedEditorialField<{ en: string[]; hi?: string[]; pa?: string[] }>;
  mantra?: FestivalMantraContent;
}

const FESTIVAL_CONTENT: FestivalContent[] = (festivalContentJson as { festivals: FestivalContent[] }).festivals;

const FESTIVAL_CONTENT_BY_SLUG: Record<string, FestivalContent> = Object.fromEntries(
  FESTIVAL_CONTENT.map((f) => [f.definitionKey, f]),
);

/** Exact-slug lookup — festivals are not fuzzy/alias-matched like recurring vrats. */
export function lookupFestivalData(slug: string): FestivalContent | null {
  return FESTIVAL_CONTENT_BY_SLUG[slug] ?? null;
}

/** Only a festival whose core narrative fields have cleared editorial review is safe to route real users to. */
export function isFestivalPublishable(festival: FestivalContent): boolean {
  return isEditorialFieldDisplayable(festival.significance) && isEditorialFieldDisplayable(festival.rituals);
}

export { isEditorialFieldDisplayable };

/** Withheld/pending fields resolve to '' — never fall back to invented prose. */
export function resolveFestivalText(
  field: LocalizedEditorialField<{ en: string; hi?: string; pa?: string }> | undefined,
  lang: 'en' | 'hi' | 'pa' = 'en',
): string {
  if (!field || !isEditorialFieldDisplayable(field)) return '';
  if (lang === 'hi' && field.value.hi && field.translationStatus?.hi !== 'pending') return field.value.hi;
  if (lang === 'pa' && field.value.pa && field.translationStatus?.pa !== 'pending') return field.value.pa;
  if (field.translationStatus?.en === 'pending') return '';
  return field.value.en || '';
}

/** Withheld/pending fields resolve to [] — never fall back to invented prose. */
export function resolveFestivalList(
  field: LocalizedEditorialField<{ en: string[]; hi?: string[]; pa?: string[] }> | undefined,
  lang: 'en' | 'hi' | 'pa' = 'en',
): string[] {
  if (!field || !isEditorialFieldDisplayable(field)) return [];
  if (lang === 'hi' && field.value.hi?.length && field.translationStatus?.hi !== 'pending') return field.value.hi;
  if (lang === 'pa' && field.value.pa?.length && field.translationStatus?.pa !== 'pending') return field.value.pa;
  if (field.translationStatus?.en === 'pending') return [];
  return field.value.en || [];
}
