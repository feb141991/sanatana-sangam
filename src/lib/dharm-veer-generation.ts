import type { SupabaseClient } from '@supabase/supabase-js';

import { generateWithProvider } from '@/lib/ai/providers/inference';
import type { DharmVeerSeed } from './dharm-veer-seeds';

type GeneratedDharmVeerContent = {
  tagline: string;
  journey: string;
  journey_local: string;
  trial: string;
  trial_local: string;
  teaching: string;
  teaching_local: string;
  moral: string;
  moral_local: string;
  legacy: string;
  legacy_local: string;
  quote: string;
  quote_local: string;
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
        'a shorter, more general statement grounded in what IS present rather than inventing detail. All prose fields under 200 words.',
      user: `Sources for ${seed.name} (${seed.tradition}, ${seed.era} era):

${sourceBlock}

Using ONLY the passages above, generate a JSON object with exactly these keys:
{
  "tagline": "one powerful sentence capturing their essence, grounded in the sources",
  "journey": "their life path in 150 words, drawn only from the sources",
  "journey_local": "same in Hindi (Devanagari script), natural not translated",
  "trial": "their defining test, sacrifice or spiritual crisis in 150 words, drawn only from the sources",
  "trial_local": "same in Hindi",
  "teaching": "their core contribution to dharma in 120 words, drawn only from the sources",
  "teaching_local": "same in Hindi",
  "moral": "what a modern seeker takes from their life in 100 words",
  "moral_local": "same in Hindi",
  "legacy": "how their life shaped the tradition, lineage, or society in 100 words, drawn only from the sources",
  "legacy_local": "same in Hindi",
  "quote": "an authentic quote appearing verbatim in the sources, else an empty string — never fabricate a quote",
  "quote_local": "the quote in original language/script if known, else empty string",
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
    tradition: seed.tradition,
    era: seed.era,
    tagline: content.tagline,
    journey: content.journey,
    journey_local: content.journey_local,
    trial: content.trial,
    trial_local: content.trial_local,
    teaching: content.teaching,
    teaching_local: content.teaching_local,
    moral: content.moral,
    moral_local: content.moral_local,
    legacy: content.legacy ?? null,
    legacy_local: content.legacy_local ?? null,
    quote: content.quote || null,
    quote_local: content.quote_local || null,
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
