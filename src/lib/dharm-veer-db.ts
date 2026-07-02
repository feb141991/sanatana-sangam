import type { SupabaseClient } from '@supabase/supabase-js';

import { DHARM_VEERS, TRADITION_META, type DharmVeer } from '@/lib/dharm-veer';

// ── Shared select columns ─────────────────────────────────────────────────────
const DAILY_COLS = 'slug, name, name_local, tradition, era, tagline, journey, journey_local, trial, trial_local, teaching, teaching_local, moral, moral_local, legacy, legacy_local, quote, quote_local, quote_source, tags';
const DHARM_VEER_COLS = `${DAILY_COLS}, illustration_prompt, day_index, created_at`;

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
  illustration_prompt?: string | null;
  day_index?: number | null;
  created_at?: string | null;
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
    illustrationPrompt: row.illustration_prompt ?? undefined,
    quote: row.quote ? { text: row.quote, attribution: row.quote_source ?? row.name } : undefined,
    quoteLocal: row.quote_local
      ? { text: row.quote_local, attribution: row.quote_source ?? row.name_local ?? row.name }
      : undefined,
    tags: row.tags ?? undefined,
  };
}

function fallbackRoster(): DharmVeer[] {
  return DHARM_VEERS;
}

export function selectDharmVeerOfTheDayFromRoster(
  roster: DharmVeer[],
  userTradition?: string | null,
): DharmVeer {
  const epoch = new Date('2024-01-01T00:00:00.000Z').getTime();
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const dayN = Math.floor((istNow.getTime() - epoch) / (1000 * 60 * 60 * 24));

  if (!userTradition) {
    return roster[dayN % roster.length];
  }

  const same = roster.filter((hero) => hero.tradition === userTradition);
  const other = roster.filter((hero) => hero.tradition !== userTradition);
  const pool = [...same, ...same, ...other];

  return (pool.length > 0 ? pool : roster)[dayN % (pool.length > 0 ? pool.length : roster.length)];
}

export async function getDharmVeerRoster(supabase: SupabaseClient): Promise<DharmVeer[]> {
  const { data, error } = await supabase
    .from('dharm_veers')
    .select(DHARM_VEER_COLS)
    .order('day_index', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('[dharm-veer] DB roster unavailable, using static fallback:', error.message);
    return fallbackRoster();
  }

  if (!data?.length) {
    return fallbackRoster();
  }

  return (data as DailyRow[]).map(rowToDharmVeer);
}

export async function getDharmVeerOfTheDay(
  supabase: SupabaseClient,
  userTradition?: string | null,
): Promise<DharmVeer> {
  const roster = await getDharmVeerRoster(supabase);
  return selectDharmVeerOfTheDayFromRoster(roster, userTradition);
}

export async function getDharmVeerBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<DharmVeer | null> {
  // Canonical generated/static-backed table.
  const { data } = await supabase
    .from('dharm_veers')
    .select(DHARM_VEER_COLS)
    .eq('slug', slug)
    .maybeSingle();

  if (data) return rowToDharmVeer(data as DailyRow);

  // Legacy daily cache fallback for rows that were generated before dharm_veers
  // became the canonical source.
  const { data: daily } = await supabase
    .from('dharm_veer_daily')
    .select(DAILY_COLS)
    .eq('slug', slug)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (daily) return rowToDharmVeer(daily as DailyRow);

  return DHARM_VEERS.find(h => h.id === slug) ?? null;
}
