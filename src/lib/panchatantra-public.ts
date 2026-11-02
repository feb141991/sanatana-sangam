/**
 * Public Panchatantra story pages (/stories/panchatantra).
 *
 * One source of truth: the same canonical content the Native app is generated from.
 * Title and moral come from katha-library.ts; the six-paragraph English and Hindi text
 * comes from packages/dharma-rules/src/stories/panchatantra-expanded.json. Nothing is
 * copied or rewritten here.
 *
 * Only stories listed in PUBLIC_PANCHATANTRA_IDS are public. The library holds 98; the
 * expanded text is a Shoonaya retelling whose review status is
 * "structure_verified_names_pending_review" (84 of 98 entries add classical names that were
 * never checked against a source). A story may be listed only if it adds none:
 * panchatantra-public.test.ts fails if an id is listed that scripts/panchatantra-new-name-flags.json
 * flags, so widening the list is a deliberate, reviewed change.
 *
 * Pages state that the text is a retelling, never a translation (docs/PANCHATANTRA_CANONICAL_SOURCE_PLAN.md,
 * section 3). No artwork is served: the Native illustrations have no recorded provenance or
 * rights status (AGENTS.md section 11).
 */

import expandedDoc from '../../packages/dharma-rules/src/stories/panchatantra-expanded.json';
import { ALL_KATHAS } from '@/lib/katha-library';

export const PANCHATANTRA_HUB_PATH = '/stories/panchatantra';
export const SITE_ORIGIN = 'https://www.shoonaya.com';

/** Listed on the founder's instruction of 2026-11-03: the first three name-clean stories. */
export const PUBLIC_PANCHATANTRA_IDS = [
  'panchatantra-crane-and-crab',
  'panchatantra-dharmabuddhi-papabuddhi',
  'panchatantra-self-sacrificing-dove',
] as const;

export type PanchatantraLang = 'en' | 'hi';

export interface PublicPanchatantraStory {
  id: string;
  slug: string;
  title: string;
  titleHi: string;
  moral: string;
  moralHi: string;
  portrait: string;
  durationMin: number;
  body: string[];
  bodyHi: string[];
}

interface ExpandedEntry {
  id: string;
  portrait: string;
  durationMin: number;
  body: string[];
  bodyHi: string[];
}

export const RETELLING_NOTICE: Record<PanchatantraLang, string> = {
  en: 'A Shoonaya retelling of a classic Panchatantra fable. It is not a translation of any single edition.',
  hi: 'यह पंचतंत्र की एक प्रसिद्ध कथा का Shoonaya द्वारा किया गया पुनर्कथन है, किसी एक संस्करण का अनुवाद नहीं।',
};

export function panchatantraSlug(id: string): string {
  return id.replace(/^panchatantra-/, '');
}

export function panchatantraStoryPath(slug: string, lang: PanchatantraLang): string {
  return lang === 'hi' ? `${PANCHATANTRA_HUB_PATH}/${slug}/hi` : `${PANCHATANTRA_HUB_PATH}/${slug}`;
}

export function panchatantraStoryUrl(slug: string, lang: PanchatantraLang): string {
  return `${SITE_ORIGIN}${panchatantraStoryPath(slug, lang)}`;
}

function buildStory(id: string): PublicPanchatantraStory | undefined {
  const katha = ALL_KATHAS.find((k) => k.id === id);
  const expanded = (expandedDoc.entries as ExpandedEntry[]).find((e) => e.id === id);
  // A story is shown only when every field a reader sees exists in both languages.
  // Nothing is synthesised: a missing title, moral or paragraph hides the story.
  if (!katha || !expanded || !katha.titleHi || !katha.phalHi) return undefined;
  if (expanded.body.length === 0 || expanded.body.length !== expanded.bodyHi.length) return undefined;
  return {
    id,
    slug: panchatantraSlug(id),
    title: katha.title,
    titleHi: katha.titleHi,
    moral: katha.phal,
    moralHi: katha.phalHi,
    portrait: expanded.portrait,
    durationMin: expanded.durationMin,
    body: expanded.body,
    bodyHi: expanded.bodyHi,
  };
}

export function listPublicPanchatantraStories(): PublicPanchatantraStory[] {
  return PUBLIC_PANCHATANTRA_IDS.map(buildStory).filter(
    (story): story is PublicPanchatantraStory => story !== undefined,
  );
}

export function findPublicPanchatantraStory(slug: string): PublicPanchatantraStory | undefined {
  return listPublicPanchatantraStories().find((story) => story.slug === slug);
}
