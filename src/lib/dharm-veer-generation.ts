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

function extractJsonObject(raw: string): string {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model did not return a JSON object');
  }
  return raw.slice(start, end + 1);
}

export async function generateDharmVeerContent(seed: DharmVeerSeed): Promise<GeneratedDharmVeerContent> {
  const result = await generateWithProvider(
    {
      system: 'You are a scholar of Indic traditions. Write with depth and reverence. All prose fields under 200 words.',
      user: `Generate Dharm Veer content for ${seed.name} (${seed.tradition}, ${seed.era} era).
Return a JSON object with exactly these keys:
{
  "tagline": "one powerful sentence capturing their essence",
  "journey": "their life path in 150 words — who they were, what shaped them",
  "journey_local": "same in Hindi (Devanagari script), natural not translated",
  "trial": "their defining test, sacrifice or spiritual crisis in 150 words",
  "trial_local": "same in Hindi",
  "teaching": "their core contribution to dharma in 120 words",
  "teaching_local": "same in Hindi",
  "moral": "what a modern seeker takes from their life in 100 words",
  "moral_local": "same in Hindi",
  "legacy": "how their life shaped the tradition, lineage, or society — lasting impact in 100 words",
  "legacy_local": "same in Hindi",
  "quote": "one authentic or attributed quote in English",
  "quote_local": "the quote in their original language/script if known",
  "quote_source": "source text or tradition",
  "illustration_prompt": "a vivid scene description (80–120 words) suitable for a digital illustration: their most iconic moment, setting, attire, symbolic objects, mood, lighting style — written for an image generation model"
}
Tags for context: ${seed.tags.join(', ')}.${seed.name_local ? ` Local name: ${seed.name_local}.` : ''}`,
    },
    { responseFormat: 'json' },
  );

  const parsed = JSON.parse(extractJsonObject(result.text)) as GeneratedDharmVeerContent;
  return parsed;
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
) {
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
  });

  if (error) throw error;
}
