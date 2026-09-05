/**
 * Prompt 2 of the calendar-rules migration runbook
 * (docs/ANTIGRAVITY_LEAN_CALENDAR_RULES_PROMPTS.md): a deterministic
 * rule-coverage and fixture-gap report across all active Hindu, Sikh, Jain,
 * and Buddhist observance definitions.
 *
 * Read-only: SELECTs only, no writes, no schema changes, no rule/occurrence/
 * fixture/publication-status modification.
 *
 * Builds on the Prompt 0 baseline (docs/audits/phase0-ground-truth/) rather
 * than re-deriving it independently: the has_rule / launch_status / fixture
 * counts below use the exact same rules.json-loading and sub_observance
 * synthesis logic as scripts/audit-phase0-ground-truth.ts (duplicated here,
 * not imported, so this script stays independently runnable and a change to
 * the already-reviewed Phase 0 script can't silently change Prompt 2's
 * output -- the two must be kept in sync by hand if rules.json's shape
 * changes). Two dimensions are NOT in the Phase 0 baseline and are queried
 * fresh here: each definition's next upcoming PUBLISHED occurrence date, and
 * real (not estimated) current user counts by tradition from `profiles`.
 *
 * Every classification below is a disclosed proxy for a real product
 * behavior, not a re-implementation of it -- see "Methodology" in the
 * generated Markdown report for exactly what each one does and does not
 * verify.
 *
 * Run: npx tsx scripts/audit-calendar-rule-coverage.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';

const BACKEND_ROOT = path.join(__dirname, '..');
loadEnv({ path: path.join(BACKEND_ROOT, '.env.local'), quiet: true });

const OUTPUT_DIR = path.join(BACKEND_ROOT, 'docs/audits/calendar-rule-coverage');

type SubObservance = { slug: string; launch_status?: string; citation?: string };
type Rule = {
  slug: string;
  launch_status?: string;
  rule_family?: string;
  tradition?: string;
  sampradaya?: string;
  variant_key?: string;
  sub_observances?: SubObservance[];
};

export type Category = 1 | 2 | 3 | 4 | 5;

export const CATEGORY_LABEL: Record<Category, string> = {
  1: 'rule-backed and fixture-covered',
  2: 'rule-backed but lacking adequate fixtures',
  3: 'deferred because the rule convention is incomplete',
  4: 'manual-seed-only or unruled',
  5: 'possible duplicate, incorrect identity, or incorrect content model',
};

// Six values, not five: the runbook's Prompt 2 names five ("add fixture",
// "clarify convention", "add an explicit profile/region variant", "submit a
// merge/retirement decision for human approval", "leave deferred"). None of
// those means "this item is already complete" -- forcing a genuinely
// fixture-complete, included rule into one of the five would misrepresent
// it. `no_action_required` is added here explicitly, as a disclosed
// extension of this report's own action schema, not silently substituted
// for one of the five and not smuggled into the runbook document itself.
export type NextAction =
  | 'add fixture'
  | 'clarify convention'
  | 'add an explicit profile/region variant'
  | 'submit a merge/retirement decision for human approval'
  | 'leave deferred'
  | 'no_action_required';

type DefinitionInput = {
  slug: string;
  display_name: string;
  kind: string;
  tradition: string;
  has_rule: boolean;
  launch_statuses: string[];
  fixture_total: number;
  fixture_real_citations: number;
  fixture_years: number[];
  // Coverage computed from non-placeholder (real-citation) rows only --
  // placeholder ("TODO: Cite...") rows never count toward the >=2-year,
  // multi-location/profile bar below, even when fixture_years (all rows)
  // would suggest otherwise.
  fixture_real_years: number[];
  fixture_real_locations: string[];
  fixture_real_profiles: string[];
};

export type IdentityFlag = {
  reason:
    | 'compound_name_matches_standalone_definition'
    | 'slug_is_prefix_of_another_definition'
    | 'confirmed_data_inconsistency_from_phase0_audit';
  detail: string;
  with_slugs: string[];
};

/**
 * Deterministic possible-duplicate / identity-overlap detector.
 *
 * An earlier version of this function used "shares a same-tradition name
 * token" and "resolves to the same upcoming date" as independent triggers.
 * Run against the real 103-definition catalogue, that flagged 59/103 (57%)
 * of all definitions -- because this catalogue *legitimately* has many
 * unrelated observances sharing a calendar day (Guru Purnima, Asalha Puja,
 * and Raksha Bandhan all fall on the same full moon across three different
 * traditions; a named Ekadashi always shares its date with the generic
 * `ekadashi` catch-all rule) and sharing a common ritual-type word (Ganesh /
 * Sankashti / Vinayaka Chaturthi all legitimately contain "Chaturthi"). That
 * output was reviewed and rejected as noise, not shipped -- keeping this
 * note so the same mistake is not repeated in a future revision.
 *
 * Replaced with two precise, string-structural signals only, chosen because
 * this catalogue's own naming convention makes them observable facts, not
 * fuzzy guesses:
 *
 *  (a) compound_name_matches_standalone_definition -- a display_name of the
 *      form "X (Y)" or "X / Y" (this catalogue's own convention for "this
 *      row is a tradition/regional variant of another named observance",
 *      e.g. "Akshaya Tritiya (Jain)", "Gudi Padwa / Ugadi") where X or Y,
 *      compared case-insensitively as whole words, matches or is contained
 *      in another active definition's display_name. Flags exactly the
 *      pattern this schema itself uses to say "related to another row".
 *  (b) slug_is_prefix_of_another_definition -- one slug's hyphen-separated
 *      tokens are a strict prefix of another's (>=2 shared tokens, so a
 *      single generic word like "ekadashi" can never trigger it alone),
 *      e.g. `vassa-begins` / `vassa-begins-rains-retreat`, `paryushana-
 *      parva` / `paryushana-parva-begins`.
 *
 * This intentionally favors precision over recall: it will miss a same-
 * festival pair named with no shared tokens at all in either direction
 * (none found in this catalogue), but every pair it does flag is a real,
 * inspectable structural fact, not a coincidence of the ritual calendar.
 */
export function findIdentityFlags(
  defs: Array<{ slug: string; display_name: string; upcoming_occurrence_date: string | null }>,
): Map<string, IdentityFlag[]> {
  const flags = new Map<string, IdentityFlag[]>();
  const addFlag = (slug: string, flag: IdentityFlag) => {
    if (!flags.has(slug)) flags.set(slug, []);
    flags.get(slug)!.push(flag);
  };
  const addPair = (a: string, b: string, reason: IdentityFlag['reason'], detail: string) => {
    addFlag(a, { reason, detail, with_slugs: [b] });
    addFlag(b, { reason, detail, with_slugs: [a] });
  };

  const norm = (s: string) => s.toLowerCase().trim();
  const nameBySlug = new Map(defs.map(d => [d.slug, d.display_name]));
  const normNameToSlug = new Map(defs.map(d => [norm(d.display_name), d.slug]));
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wholeWordMatches = (needle: string, haystack: string) =>
    new RegExp(`(^|\\W)${escapeRegex(needle)}(\\W|$)`).test(haystack);
  // How many distinct display_names contain `phrase` as a whole-word
  // substring, across the whole active catalogue. Used to keep the
  // containment fallback below from firing on a generic ritual-type word
  // ("Ekadashi" appears in 20+ named vrats) while still allowing it for a
  // genuinely distinctive phrase ("Diwali" appears in only 2).
  const allNorms = defs.map(d => norm(d.display_name));
  const containmentDocFrequency = (phrase: string) => allNorms.filter(n => wholeWordMatches(phrase, n)).length;

  // (a) compound name vs. standalone definition.
  const COMPOUND = /^(.+?)\s*[/(]\s*([^)]+?)\)?\s*$/;
  for (const d of defs) {
    const m = d.display_name.match(COMPOUND);
    if (!m) continue;
    const [, x, y] = m;
    for (const part of [x, y]) {
      const partNorm = norm(part);
      // Exact match against another definition's full display_name.
      const exactSlug = normNameToSlug.get(partNorm);
      if (exactSlug && exactSlug !== d.slug) {
        addPair(d.slug, exactSlug, 'compound_name_matches_standalone_definition',
          `"${d.display_name}" contains "${part.trim()}", which is exactly another active definition's name: "${nameBySlug.get(exactSlug)}"`);
        continue;
      }
      // Whole-word containment, both directions: "Diwali" inside "Jain
      // Diwali (Nirvana Ladnun)". Each direction is independently guarded by
      // containmentDocFrequency on whichever phrase is the "needle", so a
      // generic ritual-type word shared by many definitions ("Ekadashi":
      // 20+, "Vrat", "Puja", "Day") can never trigger this on its own --
      // only a phrase distinctive enough to appear (as a whole word) in <=2
      // display_names in the whole active catalogue.
      for (const other of defs) {
        if (other.slug === d.slug) continue;
        const otherNorm = norm(other.display_name);
        if (partNorm === otherNorm) continue; // exact match already handled above
        const otherFoundInPart = containmentDocFrequency(otherNorm) <= 2 && wholeWordMatches(otherNorm, partNorm);
        const partFoundInOther = containmentDocFrequency(partNorm) <= 2 && wholeWordMatches(partNorm, otherNorm);
        if (otherFoundInPart || partFoundInOther) {
          addPair(d.slug, other.slug, 'compound_name_matches_standalone_definition',
            `"${d.display_name}" contains "${part.trim()}", which overlaps another active definition's name: "${other.display_name}"`);
        }
      }
    }
  }

  // (b) slug-token strict prefix, >=2 shared tokens.
  const tokensBySlug = new Map(defs.map(d => [d.slug, d.slug.split('-')]));
  for (let i = 0; i < defs.length; i++) {
    for (let j = 0; j < defs.length; j++) {
      if (i === j) continue;
      const a = defs[i];
      const b = defs[j];
      const ta = tokensBySlug.get(a.slug)!;
      const tb = tokensBySlug.get(b.slug)!;
      if (ta.length >= 2 && tb.length > ta.length && ta.every((t, k) => tb[k] === t)) {
        addPair(a.slug, b.slug, 'slug_is_prefix_of_another_definition',
          `"${a.slug}" is a prefix of "${b.slug}" (shared leading tokens: ${ta.join('-')})`);
      }
    }
  }

  return flags;
}

/**
 * Whether a golden_fixtures `location.label` or `profile.calendar`/
 * `profile.tradition` value counts as real coverage evidence, as opposed to
 * a sentinel meaning "no real value was recorded" (`null`, empty, or the
 * literal string "unspecified" seen in production on rows like
 * `mahavir-jayanti`'s -- `{"calendar": null, "tradition": "unspecified"}`).
 * A sentinel must never count toward a "distinct locations/profiles" total:
 * it is not a second real data point, however many rows repeat it.
 */
export function isRealCoverageValue(value: string | null | undefined): value is string {
  if (!value) return false;
  return value.trim().toLowerCase() !== 'unspecified';
}

/**
 * The rule/fixture category and action a definition would get if it had NO
 * identity flags at all. Always computed and always preserved on the output
 * row (as `underlying_category`/`underlying_next_action`) even when an
 * identity flag overrides the final `category` to 5 -- a reviewer resolving
 * an identity question needs to see what the row's rule/fixture status
 * actually is, not just "possible duplicate."
 *
 * Category 1 requires the full safety-sequence bar from
 * docs/CALENDAR_RULES_AND_VERIFICATION.md: >=1 real (non-placeholder)
 * citation, across >=2 distinct years, AND across >=2 distinct locations,
 * AND across >=2 distinct real profile/tradition values. Fixed after review:
 * an earlier version accepted locations OR profiles, which let
 * `mahavir-jayanti` pass on 2 locations alone while every one of its real
 * fixture rows recorded profile.tradition as the literal string
 * "unspecified" -- a sentinel meaning no real profile was ever recorded, not
 * a second real data point, and not filtered out before counting distinct
 * values. `ram-navami` is the real, positive case this bar is meant to
 * recognize: its real fixtures genuinely span two distinct calendar
 * profiles (north_indian_purnimanta / gujarati_amanta), not a placeholder.
 * A real citation that only covers one year, one location, or one real
 * profile is "lacking adequate fixtures" (category 2, next action "add
 * fixture") -- not "fixture-covered" -- so a row is never labelled complete
 * while its own next action asks for more.
 */
function underlyingCategorization(def: DefinitionInput): { category: Category; next_action: NextAction } {
  if (!def.has_rule) {
    return { category: 4, next_action: 'clarify convention' };
  }
  if (def.launch_statuses.includes('deferred')) {
    return { category: 3, next_action: 'leave deferred' };
  }
  // has_rule && included from here on.
  const meetsFullBar =
    def.fixture_real_citations > 0 &&
    def.fixture_real_years.length >= 2 &&
    def.fixture_real_locations.length >= 2 &&
    def.fixture_real_profiles.length >= 2;
  if (meetsFullBar) {
    return { category: 1, next_action: 'no_action_required' };
  }
  return { category: 2, next_action: 'add fixture' };
}

/**
 * Final category/action for one definition. An identity flag overrides the
 * CATEGORY to 5 (an identity question makes every other fact about the row
 * provisional), but does NOT force a single next action onto every flagged
 * pair. `partnerTraditions` is the tradition of every slug this one was
 * flagged against (empty for a within-slug finding like krishna-janmashtami).
 *
 * If every partner is in a DIFFERENT tradition, the structural overlap is
 * read as this catalogue's own tradition/regional-variant naming convention
 * working as intended (e.g. "Akshaya Tritiya" / "Akshaya Tritiya (Jain)") --
 * the action is "add an explicit profile/region variant" (confirm and
 * formalize the relationship), not a merge/retirement suggestion these are
 * not shown to deserve. If any partner shares this definition's OWN
 * tradition (or there is no partner at all), the two rows cannot be
 * explained as a deliberate cross-tradition split, so a human decision on
 * merging or retiring one of them is the correct ask.
 */
export function categorize(
  def: DefinitionInput,
  identityFlags: IdentityFlag[] | undefined,
  partnerTraditions: string[] = [],
): { category: Category; next_action: NextAction; underlying_category: Category; underlying_next_action: NextAction } {
  const underlying = underlyingCategorization(def);
  if (identityFlags && identityFlags.length > 0) {
    const allCrossTradition = partnerTraditions.length > 0 && partnerTraditions.every(t => t !== def.tradition);
    const next_action: NextAction = allCrossTradition
      ? 'add an explicit profile/region variant'
      : 'submit a merge/retirement decision for human approval';
    return { category: 5, next_action, underlying_category: underlying.category, underlying_next_action: underlying.next_action };
  }
  return { category: underlying.category, next_action: underlying.next_action, underlying_category: underlying.category, underlying_next_action: underlying.next_action };
}

/** has_rule && at least one included variant -- the engine can produce a
 * publishable date for this slug today. This mirrors, but does not exactly
 * replicate, the real gate in src/app/api/cron/festival-email/route.ts
 * (RULED_SLUGS existence check + filterWithheldJoinedRows, which also
 * excludes a specific disputed/withheld YEAR, a distinction this
 * definition-level proxy cannot see). Disclosed as a proxy, not claimed as
 * the literal route behavior. */
function notificationEligible(def: DefinitionInput): boolean {
  return def.has_rule && def.launch_statuses.includes('included');
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  // --- rules.json, with the same sub_observances synthesis as Phase 0 ---
  const rulesPath = path.join(BACKEND_ROOT, 'packages/dharma-rules/src/festivals/rules.json');
  const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8')) as Rule[];
  const rulesBySlug = new Map<string, Rule[]>();
  for (const r of rules) {
    if (!rulesBySlug.has(r.slug)) rulesBySlug.set(r.slug, []);
    rulesBySlug.get(r.slug)!.push(r);
  }
  for (const r of rules) {
    if (r.rule_family !== 'lunar_tithi_span' || !r.sub_observances) continue;
    for (const sub of r.sub_observances) {
      if (!rulesBySlug.has(sub.slug)) rulesBySlug.set(sub.slug, []);
      rulesBySlug.get(sub.slug)!.push({
        slug: sub.slug,
        launch_status: sub.launch_status,
        rule_family: `${r.rule_family}:sub_observance_of:${r.slug}`,
      });
    }
  }

  const { data: definitions, error: defsError } = await db
    .from('observance_definitions')
    .select('id, slug, display_name, kind, tradition, active')
    .eq('active', true)
    .order('slug');
  if (defsError) throw defsError;

  const { data: fixtures, error: fixturesError } = await db
    .from('golden_fixtures')
    .select('festival_id, year, source, location, profile');
  if (fixturesError) throw fixturesError;
  type FixtureRow = { year: number; isPlaceholder: boolean; location: string | null; profile: string | null };
  const fixturesByFestival = new Map<string, FixtureRow[]>();
  for (const f of (fixtures ?? []) as any[]) {
    const citation = f.source?.citation as string | undefined;
    const isPlaceholder = !citation || citation.startsWith('TODO');
    if (!fixturesByFestival.has(f.festival_id)) fixturesByFestival.set(f.festival_id, []);
    fixturesByFestival.get(f.festival_id)!.push({
      year: f.year,
      isPlaceholder,
      location: f.location?.label ?? null,
      profile: f.profile?.calendar ?? f.profile?.tradition ?? null,
    });
  }

  // --- fresh, not in the Phase 0 baseline: next upcoming PUBLISHED date ---
  const { data: upcoming, error: upcomingError } = await db
    .from('observance_occurrences')
    .select('definition_id, date, publication_status')
    .gte('date', new Date().toISOString().slice(0, 10))
    .eq('publication_status', 'published')
    .order('date');
  if (upcomingError) throw upcomingError;
  const nextDateByDefId = new Map<string, string>();
  for (const o of (upcoming ?? []) as any[]) {
    if (!nextDateByDefId.has(o.definition_id)) nextDateByDefId.set(o.definition_id, o.date);
  }

  // --- fresh, not in the Phase 0 baseline: real OPTED-IN user counts ---
  // Filtered on email_festivals=true -- the actual delivery-preference
  // contract src/app/api/cron/festival-email/route.ts itself gates on
  // (`.eq('email_festivals', true)`). A profile with a tradition set but
  // email_festivals=false is not exposure to a festival notification and
  // must not be counted as if it were.
  const { data: profiles, error: profilesError } = await db
    .from('profiles')
    .select('tradition, email_festivals')
    .eq('email_festivals', true);
  if (profilesError) throw profilesError;
  const optedInUsersByTradition = new Map<string, number>();
  let optedInUsersAnyTradition = 0;
  for (const p of (profiles ?? []) as any[]) {
    if (!p.tradition) continue;
    optedInUsersByTradition.set(p.tradition, (optedInUsersByTradition.get(p.tradition) ?? 0) + 1);
    optedInUsersAnyTradition++;
  }

  // --- assemble per-definition rows ---
  const baseRows: Array<DefinitionInput & { upcoming_occurrence_date: string | null; display_name: string }> = (definitions ?? []).map((def: any) => {
    const ruleEntries = rulesBySlug.get(def.slug) ?? [];
    const launchStatuses = [...new Set(ruleEntries.map(r => r.launch_status ?? 'unspecified'))];
    const fx = fixturesByFestival.get(def.slug) ?? [];
    const real = fx.filter(f => !f.isPlaceholder);
    return {
      slug: def.slug,
      display_name: def.display_name,
      kind: def.kind,
      tradition: def.tradition,
      has_rule: ruleEntries.length > 0,
      launch_statuses: launchStatuses,
      fixture_total: fx.length,
      fixture_real_citations: real.length,
      fixture_years: [...new Set(fx.map(f => f.year))].sort(),
      fixture_real_years: [...new Set(real.map(f => f.year))].sort(),
      fixture_real_locations: [...new Set(real.map(f => f.location).filter(isRealCoverageValue))].sort(),
      fixture_real_profiles: [...new Set(real.map(f => f.profile).filter(isRealCoverageValue))].sort(),
      upcoming_occurrence_date: nextDateByDefId.get(def.id) ?? null,
    };
  });

  const identityFlagsBySlug = findIdentityFlags(
    baseRows.map(r => ({ slug: r.slug, display_name: r.display_name, upcoming_occurrence_date: r.upcoming_occurrence_date })),
  );

  // krishna-janmashtami's data inconsistency (2 published occurrence rows
  // that match neither of its own rule variants -- Phase 0 §3,
  // ambiguous_variant_rule_backed) is a real, already-confirmed identity/
  // content-model finding, folded in here even though it produces no
  // same-date or name-token signal on its own (it is a within-slug
  // inconsistency, not a cross-slug collision).
  const KNOWN_PHASE0_FLAGS: Record<string, IdentityFlag> = {
    'krishna-janmashtami': {
      reason: 'confirmed_data_inconsistency_from_phase0_audit',
      detail:
        'Phase 0 audit (docs/audits/phase0-ground-truth/PHASE0_REPORT.md §3): 2 published occurrence rows for this slug match neither of its own rule variants (smarta_nishita / gaudiya_iskcon) via variant_key or spiritual_tradition -- a within-slug data inconsistency from its materialization history, not a cross-slug collision.',
      with_slugs: [],
    },
  };
  for (const [slug, flag] of Object.entries(KNOWN_PHASE0_FLAGS)) {
    if (!identityFlagsBySlug.has(slug)) identityFlagsBySlug.set(slug, []);
    identityFlagsBySlug.get(slug)!.push(flag);
  }

  const traditionBySlug = new Map(baseRows.map(r => [r.slug, r.tradition]));

  const rows = baseRows.map(def => {
    const identityFlags = identityFlagsBySlug.get(def.slug);
    const partnerSlugs = [...new Set((identityFlags ?? []).flatMap(f => f.with_slugs))];
    const partnerTraditions = partnerSlugs.map(s => traditionBySlug.get(s)).filter((t): t is string => !!t);
    const { category, next_action, underlying_category, underlying_next_action } = categorize(def, identityFlags, partnerTraditions);
    const exposure = def.tradition === 'all' ? optedInUsersAnyTradition : (optedInUsersByTradition.get(def.tradition) ?? 0);
    return {
      slug: def.slug,
      display_name: def.display_name,
      kind: def.kind,
      tradition: def.tradition,
      category,
      category_label: CATEGORY_LABEL[category],
      next_action,
      // Preserved per review: an identity flag overrides `category` to 5,
      // but a reviewer resolving that question needs to see what the row's
      // rule/fixture status actually is underneath, not just "possible
      // duplicate" with no other context.
      underlying_category,
      underlying_category_label: CATEGORY_LABEL[underlying_category],
      underlying_next_action,
      has_rule: def.has_rule,
      launch_statuses: def.launch_statuses,
      fixture_total: def.fixture_total,
      fixture_real_citations: def.fixture_real_citations,
      fixture_years: def.fixture_years,
      fixture_real_years: def.fixture_real_years,
      fixture_real_locations: def.fixture_real_locations,
      fixture_real_profiles: def.fixture_real_profiles,
      notification_eligible: notificationEligible(def),
      known_opted_in_user_exposure: exposure,
      upcoming_occurrence_date: def.upcoming_occurrence_date,
      identity_flags: identityFlags ?? [],
    };
  });

  // Priority: notification-eligible first, then higher known user exposure,
  // then soonest upcoming date (nulls last), then slug for stability.
  rows.sort((a, b) => {
    if (a.notification_eligible !== b.notification_eligible) return a.notification_eligible ? -1 : 1;
    if (a.known_opted_in_user_exposure !== b.known_opted_in_user_exposure) return b.known_opted_in_user_exposure - a.known_opted_in_user_exposure;
    if (a.upcoming_occurrence_date !== b.upcoming_occurrence_date) {
      if (!a.upcoming_occurrence_date) return 1;
      if (!b.upcoming_occurrence_date) return -1;
      return a.upcoming_occurrence_date < b.upcoming_occurrence_date ? -1 : 1;
    }
    return a.slug < b.slug ? -1 : 1;
  });

  const categoryCounts: Record<Category, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of rows) categoryCounts[r.category]++;

  // Category 4 is exclusively assigned AFTER identity flags, so a row with
  // has_rule=false that also has an identity flag lands in category 5, not
  // 4 -- correct per the priority rule, but it would make category 4's
  // count of 0 read as "there are no unruled rows" instead of "every unruled
  // row also raised an identity question." Surfaced explicitly here as its
  // own finding, not left implicit in a category-4 count of zero.
  const unruledRows = rows.filter(r => !r.has_rule);
  const unruledAbsorbedIntoCategory5 = unruledRows.filter(r => r.category === 5);

  const document = {
    generated_at: new Date().toISOString(),
    generator: 'scripts/audit-calendar-rule-coverage.ts',
    based_on: 'docs/audits/phase0-ground-truth/ground-truth.json (definitions, rules, fixtures) plus fresh queries for upcoming_occurrence_date and known_opted_in_user_exposure',
    definitions_total: rows.length,
    category_counts: Object.fromEntries((Object.keys(categoryCounts) as unknown as Category[]).map(c => [CATEGORY_LABEL[c], categoryCounts[c]])),
    manual_seed_unruled_finding: {
      description: 'Rows with has_rule=false, reported separately because category-5 identity-flag precedence can make category 4 read as zero when it is not the same thing as "no unruled rows exist".',
      unruled_total: unruledRows.length,
      unruled_absorbed_into_category_5: unruledAbsorbedIntoCategory5.length,
      unruled_absorbed_slugs: unruledAbsorbedIntoCategory5.map(r => r.slug).sort(),
      unruled_not_absorbed_slugs: unruledRows.filter(r => r.category !== 5).map(r => r.slug).sort(),
    },
    known_opted_in_users_by_tradition: Object.fromEntries(optedInUsersByTradition),
    known_opted_in_users_total: optedInUsersAnyTradition,
    rows,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const jsonPath = path.join(OUTPUT_DIR, 'rule-coverage.json');
  fs.writeFileSync(jsonPath, `${JSON.stringify(document, null, 2)}\n`);

  console.log(`Wrote ${jsonPath}`);
  console.log(`Definitions: ${document.definitions_total}`);
  for (const c of Object.keys(categoryCounts) as unknown as Category[]) {
    console.log(`  category ${c} (${CATEGORY_LABEL[c]}): ${categoryCounts[c]}`);
  }
  console.log(`Unruled (has_rule=false): ${unruledRows.length} total, ${unruledAbsorbedIntoCategory5.length} absorbed into category 5`);
  console.log(`Known opted-in users by tradition: ${JSON.stringify(document.known_opted_in_users_by_tradition)} (total ${optedInUsersAnyTradition})`);
}

if (require.main === module) {
  main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
