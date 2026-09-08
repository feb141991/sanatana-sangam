import type { SupabaseClient } from '@supabase/supabase-js';

import { generateWithProvider } from '@/lib/ai/providers/inference';
import type { DharmVeerSeed } from './dharm-veer-seeds';

type GeneratedDharmVeerContent = {
  name_pa: string;
  tagline: string;
  tagline_local: string;
  tagline_pa: string;
  journey: string;
  journey_local: string;
  journey_pa: string;
  trial: string;
  trial_local: string;
  trial_pa: string;
  teaching: string;
  teaching_local: string;
  teaching_pa: string;
  moral: string;
  moral_local: string;
  moral_pa: string;
  legacy: string;
  legacy_local: string;
  legacy_pa: string;
  quote: string;
  quote_local: string;
  quote_pa: string;
  quote_source: string;
  illustration_prompt: string;
};

export interface SourceCitation {
  sourceName: string;
  sourceUrl: string;
  rightsStatus: string;
  /** The exact excerpt text the model was grounded on, for reviewer verification. */
  excerpt: string;
}

/**
 * A grounding passage fed into generateGroundedDharmVeerContent. Deliberately
 * looser than SourceCandidate (src/lib/dharm-veer-source-finder.ts) so both
 * freshly-fetched archive.org candidates AND already-verified RAG manifest
 * chunks (which carry a wider range of rights_status values, not just
 * 'public_domain') can be passed through the same grounded-generation path.
 */
export interface GroundingSource {
  sourceName: string;
  sourceUrl: string;
  excerpt: string;
}

function extractJsonObject(raw: string): string {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model did not return a JSON object');
  }
  return raw.slice(start, end + 1);
}

// NOTE: the old freeform/ungrounded generateDharmVeerContent() was removed
// here (2026-07-24 review pass). It let the model invent an entire biography
// from its own training knowledge with no source passages at all, and its
// only caller -- scripts/generate-dharm-veers.ts, a standalone batch script
// not wired into package.json or any cron -- has been deleted for the same
// reason: it inserted rows with review_status defaulting to 'approved',
// bypassing the manifest-first/auto-source/review pipeline entirely. Every
// insert into dharm_veers now goes through generateGroundedDharmVeerContent
// below, which requires at least one real source passage.

/**
 * Source-grounded variant of generateDharmVeerContent, used by the auto-sourcing
 * agent (src/lib/dharm-veer-source-finder.ts + the generate-dharm-veer cron) for
 * heroes that have no pre-built, human-verified RAG manifest but do have one or
 * more real, fetched public-domain excerpts.
 *
 * This is NOT the same trust tier as the hand-built manifests used by the
 * dharam_veer_reflection chat mode. Output from this function is always written
 * with review_status: 'pending_review' and must be approved by a human before
 * it is shown to any user (see src/lib/dharm-veer-db.ts, which filters
 * pending_review/rejected rows out of every public-facing query).
 *
 * Every English field carries an explicit word-count target. Every Hindi
 * (_local) and Punjabi (_pa) sibling field is given the SAME target -- a
 * prior version of this prompt only said "same in Hindi" with no length
 * instruction, which let the model produce a one-sentence stub against a
 * full English paragraph (verified: journey_local averaged 41% of journey's
 * length across the live table, worst case 12%). The fix is length parity,
 * explicitly stated per field, not a vague fidelity instruction alone.
 */
export async function generateGroundedDharmVeerContent(
  seed: DharmVeerSeed,
  sources: GroundingSource[],
): Promise<GeneratedDharmVeerContent> {
  if (sources.length === 0) {
    throw new Error('generateGroundedDharmVeerContent requires at least one source candidate');
  }

  const sourceBlock = sources
    .map((s, i) => `--- SOURCE ${i + 1}: ${s.sourceName} (${s.sourceUrl}) ---\n${s.excerpt}`)
    .join('\n\n');

  const result = await generateWithProvider(
    {
      system:
        'You are a careful research assistant producing source-grounded biographical content for a spiritual-education app. ' +
        'You MUST base every factual claim ONLY on the source passages provided below. Do not invent, embellish, or draw on ' +
        'outside knowledge for any specific fact, date, place, or event. If the sources do not clearly support a field, write ' +
        'a shorter, more general statement grounded in what IS present rather than inventing detail. All English prose fields ' +
        'under 200 words. For every _local (Hindi) and _pa (Punjabi) field: this is a faithful, natural-language rendering of ' +
        'the SAME facts as its English sibling field, in that language\'s own script -- not a translation gloss and not a ' +
        'shortened summary. It must carry the same facts, at the SAME approximate word-count target given for the English ' +
        'sibling field, in idiomatic Hindi (Devanagari) or Punjabi (Gurmukhi). Never add a fact that is not in the English ' +
        'sibling field, and never drop one for brevity.',
      user: `Sources for ${seed.name} (${seed.tradition}, ${seed.era} era):

${sourceBlock}

Using ONLY the passages above, generate a JSON object with exactly these keys:
{
  "name_pa": "the hero's name rendered in Punjabi (Gurmukhi script)",
  "tagline": "one powerful sentence capturing their essence, grounded in the sources",
  "tagline_local": "the SAME tagline, faithfully rendered in natural Hindi (Devanagari) -- one full sentence, not a fragment",
  "tagline_pa": "the SAME tagline, faithfully rendered in natural Punjabi (Gurmukhi) -- one full sentence, not a fragment",
  "journey": "their life path in 150 words, drawn only from the sources",
  "journey_local": "the SAME journey content in natural, idiomatic Hindi (Devanagari), approximately 150 words -- matching depth, not a shortened summary",
  "journey_pa": "the SAME journey content in natural, idiomatic Punjabi (Gurmukhi), approximately 150 words -- matching depth, not a shortened summary",
  "trial": "their defining test, sacrifice or spiritual crisis in 150 words, drawn only from the sources",
  "trial_local": "the SAME trial content in Hindi (Devanagari), approximately 150 words",
  "trial_pa": "the SAME trial content in Punjabi (Gurmukhi), approximately 150 words",
  "teaching": "their core contribution to dharma in 120 words, drawn only from the sources",
  "teaching_local": "the SAME teaching content in Hindi (Devanagari), approximately 120 words",
  "teaching_pa": "the SAME teaching content in Punjabi (Gurmukhi), approximately 120 words",
  "moral": "what a modern seeker takes from their life in 100 words",
  "moral_local": "the SAME moral content in Hindi (Devanagari), approximately 100 words",
  "moral_pa": "the SAME moral content in Punjabi (Gurmukhi), approximately 100 words",
  "legacy": "how their life shaped the tradition, lineage, or society in 100 words, drawn only from the sources",
  "legacy_local": "the SAME legacy content in Hindi (Devanagari), approximately 100 words",
  "legacy_pa": "the SAME legacy content in Punjabi (Gurmukhi), approximately 100 words",
  "quote": "an authentic quote appearing verbatim in the sources, else an empty string — never fabricate a quote",
  "quote_local": "the quote rendered in Hindi (Devanagari) if quote is non-empty, else empty string",
  "quote_pa": "the quote rendered in Punjabi (Gurmukhi) if quote is non-empty, else empty string",
  "quote_source": "which numbered source above the quote/key facts came from",
  "illustration_prompt": "a vivid scene description (80-120 words) for an image generation model, grounded in details from the sources"
}
Tags for context: ${seed.tags.join(', ')}.${seed.name_local ? ` Local name: ${seed.name_local}.` : ''}`,
    },
    { responseFormat: 'json' },
  );

  const parsed = JSON.parse(extractJsonObject(result.text)) as GeneratedDharmVeerContent;
  return parsed;
}

export function citationsFromSources(
  sources: Array<GroundingSource & { rightsStatus: string }>,
): SourceCitation[] {
  return sources.map((s) => ({
    sourceName: s.sourceName,
    sourceUrl: s.sourceUrl,
    rightsStatus: s.rightsStatus,
    excerpt: s.excerpt,
  }));
}

export async function getNextDharmVeerDayIndex(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase
    .from('dharm_veers')
    .select('day_index')
    .order('day_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.day_index ?? 0) + 1;
}

export async function insertGeneratedDharmVeer(
  supabase: SupabaseClient,
  seed: DharmVeerSeed,
  content: GeneratedDharmVeerContent,
  dayIndex: number,
  generatedBy = 'ai',
  options?: {
    sourceBacked?: boolean;
    reviewStatus?: 'approved' | 'pending_review';
    sourceCitations?: SourceCitation[];
  },
) {
  // Defaulting to 'pending_review' (rather than 'approved') means a future
  // caller that forgets to pass options explicitly fails safe -- the row
  // just sits in the review queue instead of silently going live unreviewed.
  const { error } = await supabase.from('dharm_veers').insert({
    slug: seed.slug,
    name: seed.name,
    name_local: seed.name_local ?? null,
    name_pa: content.name_pa || null,
    tradition: seed.tradition,
    era: seed.era,
    tagline: content.tagline,
    tagline_local: content.tagline_local || null,
    tagline_pa: content.tagline_pa || null,
    journey: content.journey,
    journey_local: content.journey_local,
    journey_pa: content.journey_pa || null,
    trial: content.trial,
    trial_local: content.trial_local,
    trial_pa: content.trial_pa || null,
    teaching: content.teaching,
    teaching_local: content.teaching_local,
    teaching_pa: content.teaching_pa || null,
    moral: content.moral,
    moral_local: content.moral_local,
    moral_pa: content.moral_pa || null,
    legacy: content.legacy ?? null,
    legacy_local: content.legacy_local ?? null,
    legacy_pa: content.legacy_pa || null,
    quote: content.quote || null,
    quote_local: content.quote_local || null,
    quote_pa: content.quote_pa || null,
    quote_source: content.quote_source || null,
    illustration_prompt: content.illustration_prompt || null,
    tags: seed.tags,
    day_index: dayIndex,
    generated_by: generatedBy,
    source_backed: options?.sourceBacked ?? false,
    review_status: options?.reviewStatus ?? 'pending_review',
    source_citations: options?.sourceCitations ?? [],
  });

  if (error) throw error;
}
