import type { SupabaseClient } from '@supabase/supabase-js';

import { DHARM_VEERS, TRADITION_META, getDharmVeerOfTheDay as getFallbackDharmVeerOfTheDay, type DharmVeer } from '@/lib/dharm-veer';
import { getDayOfYear } from '@/lib/sacred-texts';

type DharmVeerRow = {
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
  illustration_prompt: string | null;
  quote: string | null;
  quote_local: string | null;
  quote_source: string | null;
  day_index: number | null;
};

function toDharmVeer(row: DharmVeerRow): DharmVeer {
  const traditionMeta = TRADITION_META[row.tradition] ?? TRADITION_META.hindu;
  return {
    id: row.slug,
    name: row.name,
    nameLocal: row.name_local ?? undefined,
    era: row.era ?? 'Dharmic Era',
    eraLocal: row.era ?? undefined,
    tradition: row.tradition,
    region: traditionMeta.label,
    regionLocal: traditionMeta.labelLocal,
    emoji: traditionMeta.emoji,
    tagline: row.tagline,
    taglineLocal: undefined,
    journey: row.journey,
    journeyLocal: row.journey_local ?? undefined,
    trial: row.trial,
    trialLocal: row.trial_local ?? undefined,
    teaching: row.teaching,
    teachingLocal: row.teaching_local ?? undefined,
    moral: row.moral,
    moralLocal: row.moral_local ?? undefined,
    legacy: row.legacy ?? undefined,
    legacyLocal: row.legacy_local ?? undefined,
    illustrationPrompt: row.illustration_prompt ?? undefined,
    quote: row.quote
      ? { text: row.quote, attribution: row.quote_source ?? row.name }
      : undefined,
    quoteLocal: row.quote_local
      ? { text: row.quote_local, attribution: row.quote_source ?? row.name_local ?? row.name }
      : undefined,
  };
}

export async function getDharmVeerOfTheDay(
  supabase: SupabaseClient,
  userTradition?: string | null
): Promise<DharmVeer> {
  const { count, error: countError } = await supabase
    .from('dharm_veers')
    .select('*', { count: 'exact', head: true });

  if (countError || !count) {
    return getFallbackDharmVeerOfTheDay(userTradition);
  }

  const dayOfYear = getDayOfYear();
  const idx = (dayOfYear % count) + 1;

  const tradition = userTradition ?? 'hindu';

  // 1. Try same-tradition hero at or after today's index
  const { data, error } = await supabase
    .from('dharm_veers')
    .select('slug, name, name_local, tradition, era, tagline, journey, journey_local, trial, trial_local, teaching, teaching_local, moral, moral_local, legacy, legacy_local, illustration_prompt, quote, quote_local, quote_source, day_index')
    .gte('day_index', idx)
    .eq('tradition', tradition)
    .order('day_index')
    .limit(1)
    .maybeSingle();

  if (!error && data) {
    return toDharmVeer(data as DharmVeerRow);
  }

  // 2. Wrap around: same-tradition hero from the beginning of the list
  const { data: wrapped } = await supabase
    .from('dharm_veers')
    .select('slug, name, name_local, tradition, era, tagline, journey, journey_local, trial, trial_local, teaching, teaching_local, moral, moral_local, legacy, legacy_local, illustration_prompt, quote, quote_local, quote_source, day_index')
    .eq('tradition', tradition)
    .order('day_index')
    .limit(1)
    .maybeSingle();

  if (wrapped) {
    return toDharmVeer(wrapped as DharmVeerRow);
  }

  // 3. Any tradition — at or after today's index
  const { data: anyTrad } = await supabase
    .from('dharm_veers')
    .select('slug, name, name_local, tradition, era, tagline, journey, journey_local, trial, trial_local, teaching, teaching_local, moral, moral_local, legacy, legacy_local, illustration_prompt, quote, quote_local, quote_source, day_index')
    .gte('day_index', idx)
    .order('day_index')
    .limit(1)
    .maybeSingle();

  if (anyTrad) {
    return toDharmVeer(anyTrad as DharmVeerRow);
  }

  return getFallbackDharmVeerOfTheDay(userTradition);
}

export async function getDharmVeerBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<DharmVeer | null> {
  const { data, error } = await supabase
    .from('dharm_veers')
    .select('slug, name, name_local, tradition, era, tagline, journey, journey_local, trial, trial_local, teaching, teaching_local, moral, moral_local, legacy, legacy_local, illustration_prompt, quote, quote_local, quote_source, day_index')
    .eq('slug', slug)
    .maybeSingle();

  if (!error && data) {
    return toDharmVeer(data as DharmVeerRow);
  }

  return DHARM_VEERS.find((hero) => hero.id === slug) ?? null;
}
