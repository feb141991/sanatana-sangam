import rulesJson from '../../../packages/dharma-rules/src/festivals/rules.json';
import contentJson from '../../../packages/dharma-rules/src/festivals/festival-content.json';

export const EXTERNALLY_CURATED_SLUGS = [
  'shani-jayanti',
  'vat-savitri-amavasya',
  'vat-savitri-purnima',
  'nag-panchami',
  'guru-purnima',
  'vivah-panchami',
  'gupt-navratri-ashadha-begins',
  'gupt-navratri-magha-begins',
  'jagannath-rath-yatra',
] as const;

export type ExternallyCuratedSlug = typeof EXTERNALLY_CURATED_SLUGS[number];

export const EXTERNALLY_CURATED_SET = new Set<string>(EXTERNALLY_CURATED_SLUGS);
export const UJJAIN_REFERENCE = {
  calendar_profile: 'legacy-ujjain',
  spiritual_tradition: null,
  variant_key: 'legacy-default',
  computed_latitude: 23.1765,
  computed_longitude: 75.7885,
  computed_timezone: 'Asia/Kolkata',
} as const;

const CONTENT_FIELDS = ['name', 'tagline', 'significance', 'rituals', 'dos', 'donts', 'pujaItems', 'mantra'] as const;

export function isExternallyCuratedSlug(slug: string): slug is ExternallyCuratedSlug {
  return EXTERNALLY_CURATED_SET.has(slug);
}

export function externallyCuratedReadiness(slug: ExternallyCuratedSlug) {
  const rule = (rulesJson as any[]).find((candidate) => candidate.slug === slug);
  const content = (contentJson.festivals as any[]).find((candidate) => candidate.definitionKey === slug);
  const pendingSourceFields = content
    ? CONTENT_FIELDS.filter((field) => content[field]?.status === 'pending_source')
    : ['content_entry'];
  return {
    slug,
    displayName: rule?.display_name ?? slug,
    launchStatus: rule?.launch_status ?? 'deferred',
    pendingSourceFields,
  };
}

export function allExternallyCuratedReadiness() {
  return EXTERNALLY_CURATED_SLUGS.map(externallyCuratedReadiness);
}
