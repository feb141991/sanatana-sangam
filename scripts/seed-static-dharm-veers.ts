import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

import { DHARM_VEERS, type DharmVeer } from '../src/lib/dharm-veer';

config({ path: '.env.local' });
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const checkedSupabaseUrl = supabaseUrl;
const checkedServiceRoleKey = serviceRoleKey;

type DharmVeerSeedRow = {
  slug: string;
  name: string;
  name_local: string | null;
  tradition: DharmVeer['tradition'];
  era: string | null;
  tagline: string;
  journey: string;
  journey_local: string | null;
  trial: string;
  trial_local: string | null;
  teaching: string;
  teaching_local: string | null;
  moral: string;
  moral_local: string | null;
  legacy: string | null;
  legacy_local: string | null;
  quote: string | null;
  quote_local: string | null;
  quote_source: string | null;
  tags: string[];
  illustration_prompt: string | null;
  day_index: number;
  generated_by: string;
};

function toRow(hero: DharmVeer, index: number): DharmVeerSeedRow {
  return {
    slug: hero.id,
    name: hero.name,
    name_local: hero.nameLocal ?? null,
    tradition: hero.tradition,
    era: hero.era ?? null,
    tagline: hero.tagline,
    journey: hero.journey,
    journey_local: hero.journeyLocal ?? null,
    trial: hero.trial,
    trial_local: hero.trialLocal ?? null,
    teaching: hero.teaching,
    teaching_local: hero.teachingLocal ?? null,
    moral: hero.moral,
    moral_local: hero.moralLocal ?? null,
    legacy: hero.legacy ?? null,
    legacy_local: hero.legacyLocal ?? null,
    quote: hero.quote?.text ?? null,
    quote_local: hero.quoteLocal?.text ?? null,
    quote_source: hero.quote?.attribution ?? hero.quoteLocal?.attribution ?? hero.source ?? null,
    tags: hero.tags ?? [],
    illustration_prompt: hero.illustrationPrompt ?? null,
    day_index: index + 1,
    generated_by: 'static-curated-v1',
  };
}

async function main() {
  const supabase = createClient(checkedSupabaseUrl, checkedServiceRoleKey);
  const rows = DHARM_VEERS.map(toRow);

  const { error } = await supabase
    .from('dharm_veers')
    .upsert(rows, { onConflict: 'slug' });

  if (error) throw error;

  const { data: seededRows, error: verifyError } = await supabase
    .from('dharm_veers')
    .select('tradition, slug, day_index')
    .in('slug', rows.map((row) => row.slug));

  if (verifyError) throw verifyError;

  const counts = new Map<DharmVeer['tradition'], number>();
  for (const row of seededRows ?? []) {
    counts.set(row.tradition as DharmVeer['tradition'], (counts.get(row.tradition as DharmVeer['tradition']) ?? 0) + 1);
  }

  console.log(`[dharm-veers] upserted ${rows.length} curated heroes`);
  console.log(`[dharm-veers] verified ${seededRows?.length ?? 0} rows by slug`);
  console.log(`[dharm-veers] by tradition ${JSON.stringify(Object.fromEntries(counts.entries()))}`);
}

void main().catch((error) => {
  console.error('[dharm-veers] seed failed:', error);
  process.exit(1);
});
