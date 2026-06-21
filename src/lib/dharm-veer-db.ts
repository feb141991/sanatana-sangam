import type { SupabaseClient } from '@supabase/supabase-js';

import { DHARM_VEERS, TRADITION_META, getDharmVeerOfTheDay as getFallbackDharmVeerOfTheDay, type DharmVeer } from '@/lib/dharm-veer';
import { generateDharmVeerContent } from '@/lib/dharm-veer-generation';
import { HERO_SEEDS } from '@/lib/dharm-veer-seeds';

// ── Shared select columns ─────────────────────────────────────────────────────
const DAILY_COLS = 'slug, name, name_local, tradition, era, tagline, journey, journey_local, trial, trial_local, teaching, teaching_local, moral, moral_local, legacy, legacy_local, quote, quote_local, quote_source, tags';

type DailyRow = {
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
  tags?: string[] | null;
};

function rowToDharmVeer(row: DailyRow): DharmVeer {
  const meta = TRADITION_META[row.tradition] ?? TRADITION_META.hindu;
  return {
    id: row.slug,
    name: row.name,
    nameLocal: row.name_local ?? undefined,
    era: row.era ?? 'Dharmic Era',
    tradition: row.tradition,
    region: meta.label,
    regionLocal: meta.labelLocal,
    emoji: meta.emoji,
    tagline: row.tagline,
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
    quote: row.quote ? { text: row.quote, attribution: row.quote_source ?? row.name } : undefined,
    quoteLocal: row.quote_local
      ? { text: row.quote_local, attribution: row.quote_source ?? row.name_local ?? row.name }
      : undefined,
  };
}

export async function getDharmVeerOfTheDay(
  supabase: SupabaseClient,
  userTradition?: string | null,
): Promise<DharmVeer> {
  // We no longer generate Dharm Veers via AI on the fly.
  // We return a deterministic static hero as the SSR fallback.
  // The true per-user rotation memory runs on the client via selectDharmVeer.
  return getFallbackDharmVeerOfTheDay(userTradition);
}

export async function getDharmVeerBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<DharmVeer | null> {
  // Check daily cache first
  const { data: daily } = await supabase
    .from('dharm_veer_daily')
    .select(DAILY_COLS)
    .eq('slug', slug)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (daily) return rowToDharmVeer(daily as DailyRow);

  // Legacy dharm_veers table
  const { data } = await supabase
    .from('dharm_veers')
    .select('slug, name, name_local, tradition, era, tagline, journey, journey_local, trial, trial_local, teaching, teaching_local, moral, moral_local, legacy, legacy_local, illustration_prompt, quote, quote_local, quote_source')
    .eq('slug', slug)
    .maybeSingle();

  if (data) return rowToDharmVeer(data as DailyRow);

  return DHARM_VEERS.find(h => h.id === slug) ?? null;
}
