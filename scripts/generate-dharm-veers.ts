import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';

import { HERO_SEEDS } from '../src/lib/dharm-veer-seeds';
import { generateDharmVeerContent, getNextDharmVeerDayIndex, insertGeneratedDharmVeer } from '../src/lib/dharm-veer-generation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`[dharm-veers] starting generation for ${HERO_SEEDS.length} seeds`);

  let nextDayIndex = await getNextDharmVeerDayIndex(supabase);

  for (let offset = 0; offset < HERO_SEEDS.length; offset += 10) {
    const batch = HERO_SEEDS.slice(offset, offset + 10);

    for (const seed of batch) {
      try {
        const { data: existing } = await supabase
          .from('dharm_veers')
          .select('slug')
          .eq('slug', seed.slug)
          .maybeSingle();

        if (existing) {
          console.log(`[dharm-veers] skip existing ${seed.slug}`);
          continue;
        }

        const content = await generateDharmVeerContent(seed);
        await insertGeneratedDharmVeer(supabase, seed, content, nextDayIndex, 'ai-batch');
        console.log(`[dharm-veers] inserted ${seed.slug} @ day_index=${nextDayIndex}`);
        nextDayIndex += 1;
      } catch (error) {
        console.error(`[dharm-veers] failed ${seed.slug}`, error);
      }
    }

    if (offset + 10 < HERO_SEEDS.length) {
      await sleep(500);
    }
  }

  console.log('[dharm-veers] generation complete');
}

void main();
