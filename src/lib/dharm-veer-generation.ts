import type { SupabaseClient } from '@supabase/supabase-js';

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
  quote: string;
  quote_local: string;
  quote_source: string;
};

function extractJsonObject(raw: string): string {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Claude did not return a JSON object');
  }
  return raw.slice(start, end + 1);
}

export async function generateDharmVeerContent(seed: DharmVeerSeed): Promise<GeneratedDharmVeerContent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 2200,
      temperature: 0.5,
      system: 'You are a scholar of Indic traditions. Write with depth and reverence. All prose under 200 words per field.',
      messages: [
        {
          role: 'user',
          content: `Generate Dharm Veer content for ${seed.name} (${seed.tradition}, ${seed.era} era).\nReturn a JSON object with exactly these keys:\n{\n  "tagline": "one powerful sentence capturing their essence",\n  "journey": "their life path in 150 words — who they were, what shaped them",\n  "journey_local": "same in Hindi (Devanagari script), natural not translated",\n  "trial": "their defining test, sacrifice or spiritual crisis in 150 words",\n  "trial_local": "same in Hindi",\n  "teaching": "their core contribution to dharma in 120 words",\n  "teaching_local": "same in Hindi",\n  "moral": "what a modern seeker takes from their life in 100 words",\n  "moral_local": "same in Hindi",\n  "quote": "one authentic or attributed quote in English",\n  "quote_local": "the quote in their original language/script if known",\n  "quote_source": "source text or tradition"\n}\nTags for context: ${seed.tags.join(', ')}.${seed.name_local ? ` Local name: ${seed.name_local}.` : ''}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Claude ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = await response.json() as {
    content?: Array<{ type: string; text?: string }>;
  };

  const text = data.content?.find((item) => item.type === 'text')?.text ?? '';
  const parsed = JSON.parse(extractJsonObject(text)) as GeneratedDharmVeerContent;
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
    quote: content.quote || null,
    quote_local: content.quote_local || null,
    quote_source: content.quote_source || null,
    tags: seed.tags,
    day_index: dayIndex,
    generated_by: generatedBy,
  });

  if (error) throw error;
}
