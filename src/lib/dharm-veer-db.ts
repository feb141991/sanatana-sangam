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

// ── On-demand daily generation — same pattern as daily_quiz ──────────────────
export async function getDharmVeerOfTheDay(
  supabase: SupabaseClient,
  userTradition?: string | null,
): Promise<DharmVeer> {
  const tradition = (userTradition ?? 'hindu') as DharmVeer['tradition'];
  const today = new Date().toISOString().split('T')[0];

  // 1. Serve from cache if already generated today for this tradition
  const { data: cached } = await supabase
    .from('dharm_veer_daily')
    .select(DAILY_COLS)
    .eq('tradition', tradition)
    .eq('date', today)
    .maybeSingle();

  if (cached) return rowToDharmVeer(cached as DailyRow);

  // 2. Pick a seed not seen in the last 90 days for this tradition
  const ninetyAgo = new Date();
  ninetyAgo.setDate(ninetyAgo.getDate() - 90);
  const ninetyAgoStr = ninetyAgo.toISOString().split('T')[0];

  const { data: recentRows } = await supabase
    .from('dharm_veer_daily')
    .select('slug')
    .eq('tradition', tradition)
    .gte('date', ninetyAgoStr)
    .order('date', { ascending: false });

  const recentSlugs = new Set((recentRows ?? []).map((r: any) => r.slug as string));

  // Seeds for this tradition, excluding recent ones
  const traditionSeeds = HERO_SEEDS.filter(s => s.tradition === tradition);
  const freshSeeds = traditionSeeds.filter(s => !recentSlugs.has(s.slug));

  // Pick deterministically by day-of-year so all users get the same hero
  const dayOfYear = Math.floor(
    (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const pool = freshSeeds.length > 0 ? freshSeeds : traditionSeeds;
  const seed = pool[dayOfYear % pool.length];

  if (!seed) return getFallbackDharmVeerOfTheDay(userTradition);

  // 3. Generate with AI
  try {
    const content = await generateDharmVeerContent(seed);

    // 4. Cache in DB (ignore conflict — another request may have just inserted)
    await supabase.from('dharm_veer_daily').upsert({
      tradition,
      date: today,
      slug: seed.slug,
      name: seed.name,
      name_local: seed.name_local ?? null,
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
      tags: seed.tags,
      generated_by: 'ai-on-demand',
    }, { onConflict: 'tradition,date', ignoreDuplicates: true });

    return rowToDharmVeer({
      slug: seed.slug,
      name: seed.name,
      name_local: seed.name_local ?? null,
      tradition,
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
    });
  } catch {
    // AI failed — use weighted static fallback
    return getFallbackDharmVeerOfTheDay(userTradition);
  }
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
